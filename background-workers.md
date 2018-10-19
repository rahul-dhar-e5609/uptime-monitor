# Background Workers

## 

For performing the checks the user creates in the application, we need background workers, the background processes. At this point the nature of our application is fundamentally changing. We are going from a server that simply starts up and listens on a port to an application that starts up a server and starts out background workers and needs to do both the things at the same time.

We need to start refactoring the code, instead of having an index.js that simply boots up the server, we will have a much smaller index.js that will simply call a server.js and then will call a worker's file to start up the new workers which we are gonna write.



> Workers are going to do all of the checking that has been done by all the users, so one of the things the workers are going to have to do is gather up all the checks.

Before getting to the background workers, we need to modify the data.js as it does not support a function that can list all the checks in the storage.

