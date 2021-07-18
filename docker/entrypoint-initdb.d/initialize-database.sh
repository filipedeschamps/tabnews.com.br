#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE tabnews_test;
    GRANT ALL PRIVILEGES ON DATABASE tabnews_test TO tabnews;

EOSQL
