# stream-models

- 5-streaming-cluster-nodes

```
	.
	├── cluster.js    <- contains master/workers definition belongs to cluster, each node listen per port 7001.
	|									1. Send data from streaming channel opened from main process (fd:3)
	|									2. Send to available cluster node by socket streaming by 7001
	|									3. Node does hard work over streaming data incoming from socket (originally from fd:3 )
	|								and return it back to socket.
	|
	├── model.js      <- model (main process), send streaming data to spawn cluster from inbounds to
  |
  |
	|
	└── launcher.js   <- launch a sample model:
											- using readable/writable stream module: 'unit.js'.
											- 52 clients over 8 nodes (cpus cores).
										1. Send random data through system
										2. It is showing up when data are giving back from outbounds binded to output.
```



