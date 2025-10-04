# Cupcake Vanilla Electron App

An electron wrapper for Cupcake Vanilla Angular Application.

## Requirements
- Redis/Valkey installed (or would be installed by the script on setup)
  - On Windows, you can use [Memurai](https://www.memurai.com/) as a Redis alternative that can be installed from there or from [Chocolatey](https://community.chocolatey.org/packages/memurai-developer/)
  - On macOS, you can install Redis via [Homebrew](https://brew.sh/) using `brew install redis` or with `port install redis` if you use MacPorts. You can also use [Valkey](https://valkey.io/) as an alternative.
  - On Linux, you can install either redis or valkey via your package manager. For example, on Debian-based systems, you can use `sudo apt-get install redis` or `sudo apt-get install valkey`.
- Python 3.11 or higher (or would be installed by the script on setup)

## Installation
- Depending on your OS, you can retrieve the tar.gz package or binary from the [releases](https://github.com/noatgnu/cupcake-vanilla-ng/releases)
- If you downloaded the tar.gz package, extract it to your desired location
  - Run the binary cupcake-vanilla-electron (or cupcake-vanilla-electron.exe on Windows)
- If you don't have Python 3.11 or higher installed, the script will ask if you want to retrieve a portable environment for Python with all dependencies included
- If you choose to use existing Python, make sure that `venv` module is available
  - Using `venv` module, the script will create a virtual environment and install all dependencies after downloading the backend django source code
- If you don't have Redis/Valkey installed, the script will ask if you want

## Initial Setup
- After successful startup, on first run, the app will ask you to set up an admin account
- After setting up the admin account, you can log in with the credentials you just created
- It is recommended to load the database with default schemas from sdrf-pipelines by going to `Management > Database Setup`
  - Perform `Schema Synchronization` first
  - Then load `Column Templates`
  - Following by populating the rest of the ontology databases.


