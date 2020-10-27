#!/bin/bash

function check_existence {
    if ! command -v $1 &>/dev/null
    then
        echo "Command $1 not found"
        exit 1
    fi
}

function assert_ok {
    if [[ $? -ne 0 ]]; then
        exit 1
    fi
}

check_existence node
check_existence npm

node -e "if (process.version.match(/v(\\d+)/)[1] < 12) process.exit(1)"
if [[ $? -ne 0 ]]; then
    echo "Please use node version 12 or higher"
    exit 1
fi

echo Building AKSO Bridge
../../../bin/composer.phar install
assert_ok

echo Building aksobridged
cd aksobridged
npm install
assert_ok

cd php
../../../../../bin/composer.phar install
assert_ok
cd ../..

echo Building AKSO Bridge JS
cd js-form
npm install
assert_ok
npm run build
assert_ok
