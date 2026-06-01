// grpcClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './protos/iot_generic_v1.proto';

// Load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).iot_generic.grpc.v1;

// Store active gRPC clients by target (IP + Port)
// This module encapsulates the connections and allow reuse so that we don't incur the overhead of recreating the connections over and over again
const grpcClients = {};

function getGrpcClient(target) {
  if (!grpcClients[target]) {
    grpcClients[target] = new proto.IoTProducerSvc(
      target,
      grpc.credentials.createInsecure()
    );
    console.log(`Created new gRPC client for target: ${target}`);
  }
  return grpcClients[target];
}

function closeGrpcClient(target) {
  if (grpcClients[target]) {
    grpcClients[target].close();  // Close the gRPC connection
    delete grpcClients[target];   // Remove the client from the cache
    console.log(`Closed gRPC client for target: ${target}`);
  }
}

module.exports = { getGrpcClient, closeGrpcClient };
