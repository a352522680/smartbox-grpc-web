const IOT_STATUS_CODE =
{
  OK: 0x01
};

const FACILITY_NAME_MAP =
{
  "1": "加工栋",
  "2": "组立栋"
};

const UTILITY_META =
{
  energy:
  {
    fieldName: "energy_usage",
    rawUnit: "kWh",
    displayUnit: "1000 kWh",
    displayDivisor: 1000
  },
  water:
  {
    fieldName: "water_usage",
    rawUnit: "m^3",
    displayUnit: "m^3",
    displayDivisor: 1
  },
  air:
  {
    fieldName: "air_usage",
    rawUnit: "Nm^3",
    displayUnit: "Nm^3",
    displayDivisor: 1
  }
};

module.exports =
{
  IOT_STATUS_CODE,
  FACILITY_NAME_MAP,
  UTILITY_META
};
