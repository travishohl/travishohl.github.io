---
layout: post
title:  "Including Data in a MySQL Docker Image"
author: "Travis Hohl"
date:   2019-10-21
---

It's common practice for Docker-powered database images to use volumes to
persist data between container restarts. But if you want to minimize the initial
setup time for your local development environment or if you need to run an
automated end-to-end test suite in the cloud, you should consider building a
baseline set of test data into the image itself.

MySQL and Postgres images both offer a `/docker-entrypoint-initdb.d` directory
in which the images' entrypoint script will look for and execute SQL files when
the container is started for the first time. If your SQL files need to be
changed frequently or if you don't mind the extra startup time needed to execute
these files, then I'd recommend using this method to load your initial data.

If you need the database container to start up and be available right away (and
you don't mind a larger image size) then you should consider building your own
database image that includes the initial data. The database container will still
function the same as a container whose image contained no data (in other words,
the database will be writable and it's state will be preserved between container
restarts). But when you start the container it will be ready to accept
connections more quickly than a container that needs to execute SQL files.

## Building the Image

The following Dockerfile will use an intermediate container to build a MySQL
image containing the data imported by the intermediate container.

```
# Use an intermediate container to restore from SQL dump files
FROM mysql:5.7 AS intermediate
ARG container_entrypoint=/usr/local/bin/docker-entrypoint.sh
ARG mysql_config_file=/etc/mysql/my.cnf
ARG sql_file_source=storage/
ENV MYSQL_ROOT_PASSWORD ${MYSQL_ROOT_PASSWORD:-root}
ENV MYSQL_DATABASE ${MYSQL_DATABASE:-some_database_name}
ENV MYSQL_USER ${MYSQL_USER:-some_username}
ENV MYSQL_PASSWORD ${MYSQL_PASSWORD:-some_password}

COPY ${sql_file_source} /docker-entrypoint-initdb.d/

# Move the data directory to a non-volume'd path
RUN mkdir /temp_data_directory
RUN echo '[mysqld]\ndatadir=/temp_data_directory/' >> ${mysql_config_file}

# Prevent mysqld from starting (`exec "$@"`) after initialization
RUN sed -i '/exec "$@"/d' ${container_entrypoint}

RUN ${container_entrypoint} --max-allowed-packet=1GB


# Build the final image using the data directory from the intermediate container
FROM mysql:5.7 AS final
ARG final_data_directory=/var/lib/mysql
COPY --chown=mysql:mysql --from=intermediate /temp_data_directory ${final_data_directory}
VOLUME ${final_data_directory}
```

Assuming a build context that looks like this:

```
.
|-- Dockerfile
`-- storage
    `-- import.sql
```

Then a relatively simple build command can be used to create the image:

```
$ docker build \
    --rm \
    --tag mysql_with_data \
    .
```

If you want to do this with a Postgres image, I recommend [this article which
describes a similar build process for
Postgres](https://medium.com/@sharmaNK/build-postgres-docker-image-with-data-included-489bd58a1f9e)
using an intermediate container.

### Why do we need an intermediate container?

The intermediate container performs steps (in this case the SQL import) _during_
the build process that we would normally only be able perform _after_ the build
process. The intermediate container achieves the state that we want our
container to be in immediately after startup.

### Where do I put my SQL files?

In the `<build-context>/storage` directory. By default, the Dockerfile instructs
Docker to copy the contents of `./storage` (relative to the build context) into
the intermediate container:

```
ARG sql_file_source=storage/
# ...
COPY ${sql_file_source} /docker-entrypoint-initdb.d/
```

After they're copied, the files will be processed by the MySQL image's
entrypoint script. At the time of writing, [the documentation for the MySQL
image](https://hub.docker.com/_/mysql) states that the image's entrypoint script
"...will execute files with extensions `.sh`, `.sql` and `.sql.gz` ... in
alphabetical order."

If you'd like to use a different directory or if you'd like to specify a single
SQL file, you can override `sql_file_source` by passing a `--build-arg` flag to
the `docker build` command:

```
$ docker build \
    --rm \
    --build-arg sql_file_source=import_this.sql \
    --tag mysql_with_data \
    .
```

### Why did you pass `--max-allowed-packet=1GB` to the intermediate container's entrypoint script?

To reduce the likelihood that you'll encounter an error during the intermediate
container's SQL import step. According to [this StackExchange
answer](https://dba.stackexchange.com/a/45667), setting `--max-allowed-packet`
to the highest setting (1GB) will _not_ cause MySQL to immediately allocate
query packets that are 1GB large. The query packets will only be allowed to grow
to 1GB only if they need to.

It's also important to note that the `--max-allowed-packet` flag only affects
the intermediate container. When the intermediate container is finished running
the SQL import, we shut it down and discard it.

### Why did you use a `temp_data_directory` in the intermediate container?

The `mysql:5.7` image [declares a volume in its
Dockerfile](https://github.com/moby/moby/issues/3639#issuecomment-351876965) for
the default data directory (`/var/lib/mysql`). Because Docker handles volume
data in a special way, we wouldn't be able to copy the data directory from the
intermediate container if we left it in the default location under the
intermediate container's declared volume. Docker doesn't provide a warning or
error message during the build, the final container merely starts up like a
fresh database without any data.

### Do you have to use `sed` to edit the intermediate container's entrypoint script?

Unfortunately, yes. I believe so. Editing the intermediate container's
entrypoint script prevents the intermediate container from starting the `mysqld`
daemon which will simply sit and waiting for incoming connections. My choices
seemed to be either edit the entrypoint script before starting the intermediate
container, or attempt to connect to the intermediate container withing the build
process in order to shut down `mysqld`. Please let me know if you have an
alternative though because I'm not thrilled about editing the entrypoint file.
