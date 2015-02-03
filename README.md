# stream-models

- 5-streaming-cluster-nodes

	.
	├── cluster.js <- contains master/workers definition belongs to cluster, each node listen per port 7001.
	|									1. Send data from streaming channel opened from main process (fd:3) 
	|									2. Send to available cluster node by socket streaming by 7001
	|									3. Node does hard work over streaming data incoming from socket (originally from fd:3 ) 
	|								and return it back to socket.
	|
	|
	└── model.js   <- model launcher (main process), send streaming data to spawn cluster from stdin channel
										or from server listening on port 7000
										How to: 'nc localhost 7000' and type: 'thisIsAChicken!'


		