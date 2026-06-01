function toTimestamp(value)
{
  // 将配置文件中的 ISO 时间字符串转成 protobuf Timestamp 需要的字段格式。
  const date = new Date(value);

  if (Number.isNaN(date.getTime()))
  {
    throw new Error(`Invalid date value: ${value}`);
  }

  const milliseconds = date.getTime();

  return {
    seconds: Math.floor(milliseconds / 1000).toString(),
    nanos: (milliseconds % 1000) * 1000000
  };
}

function timestampToIsoString(timestamp)
{
  if (!timestamp || typeof timestamp.seconds === "undefined")
  {
    return "";
  }

  const seconds = Number(timestamp.seconds);
  const nanos = Number(timestamp.nanos || 0);
  const milliseconds = (seconds * 1000) + Math.floor(nanos / 1000000);

  return new Date(milliseconds).toISOString();
}

function validateTimeRange(startTime, endTime)
{
  // mock service 会共用这段检查，避免每个 RPC 重复验证时间范围。
  const startMilliseconds = Date.parse(startTime);
  const endMilliseconds = Date.parse(endTime);

  if (Number.isNaN(startMilliseconds) || Number.isNaN(endMilliseconds))
  {
    return "start_time 或 end_time 不是合法时间";
  }

  if (startMilliseconds >= endMilliseconds)
  {
    return "start_time 必须早于 end_time";
  }

  return null;
}

module.exports =
{
  toTimestamp,
  timestampToIsoString,
  validateTimeRange
};
