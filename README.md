# stream-models

- 5-streaming-cluster-nodes

```
	.
	├── cluster.js    <- Contains clustering approach. Each node spawn would be listening on local port.
	|						1. Send data from a defined streaming channel opened when spawn child (fd:3).
	|						2. Send streaming data to one of listening cluster node (RR) from any of socket clients.
	|						3. Each cluster node bind the streaming flow through defined stream module. (i.e unit.js).
	|						4. Node does hard work over streaming data on a instance of stream module defined for the worker.
	|
	|
	├── model.js      <- Model (main process), send streaming data to spawn cluster nodes with a defined stream module.
	|
	|						// Model with streaming defined on 'unit.js'
	|						// multiplex streaming into 52 clients over 8 nodes cluster.
	|						var model = require('./mode.js');
	|						model(process.stdin, process.stdout, 'unit', {
	|						  clients: 52
	|						});
	|
	|
	└── launcher.js   <- launch a sample model:
								- using readable/writable stream module: 'unit.js'.
								- 52 clients over 8 nodes (cpus cores).
							1. Send random data through system
							2. It is showing up when data are giving back from outbounds binded to output.

![](https://raw.githubusercontent.com/vrandkode/stream-models/master/doc/5/streaming_figure1.jpg)
```

Using launcher example:

```
node launcher.js
```


