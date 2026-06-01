const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const protoRoot = path.resolve(__dirname,"..", "protos");
const serviceProtoPath = path.join(protoRoot, "ServiceTypes_AuxSbox", "Svc_CncPlcService.proto");

const packageDefinition = protoLoader.loadSync(serviceProtoPath,
{
  keepCase: true,
  longs: String,
  enums: Number,
  defaults: true,
  oneofs: true,
  includeDirs: [protoRoot]
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

function normalizeSmartboxTarget(smartboxTarget)
{
  // 配置文件要求使用 http://ip:port，grpc-js 连接前需要去掉 scheme。
  return smartboxTarget.replace(/^https?:\/\//i, "");
}

function createCncPlcClient(smartboxTarget)
{
  const grpcTarget = normalizeSmartboxTarget(smartboxTarget);

  return new protoDescriptor.smt_iot.v1.aux.CncPlcService(
    grpcTarget,
    grpc.credentials.createInsecure()
  );
}

module.exports =
{
  grpc,
  protoDescriptor,
  createCncPlcClient,
  normalizeSmartboxTarget
};
