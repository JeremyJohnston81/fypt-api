import { dataApi } from "../handlers/mongodb";

const dbName = "hcad";

export default class HcadStore {
  async getLastUpdated() {
    try {
      const { document } = await dataApi("lastUpdated", "findOne", {});

      return document;
    } catch (err) {
      console.log(err);
      return this.#err();
    }
  }

  async getAccountID(address) {
    try {
      const addressArray = address.split(" ");
      const excludeWords = [
        "ST",
        "LN",
        "STREET",
        "LANE",
        "AVE",
        "AVENUE",
        "DR",
        "DRIVE",
        "JCT",
        "JUNCTION",
        "PKWY",
        "PARKWAY",
        "PL",
        "PLACE",
        "RD",
        "ROAD",
        "RTE",
        "ROUTE",
      ];

      //We need to parse this address
      const streetNum = addressArray[0];
      let streetName = "";

      for (var i = 1; i < addressArray.length; i++) {
        if (excludeWords.indexOf(addressArray[i].toUpperCase()) < 0)
          streetName += " " + addressArray[i];
      }

      const query = {
        pipeline: [
          {
            $match: {
              $and: [
                { streetNum: { $numberLong: streetNum } },
                { $text: { $search: streetName } },
              ],
            },
          },
          {
            $project: {
              account: 1,
              owner: 1,
              addr1: 1,
              addr2: 1,
              addr3: 1,
              _id: 0,
            },
          },
        ],
      };

      const { documents } = await dataApi(dbName, "aggregate", query);

      return documents;
    } catch (err) {
      console.log(err);
      return this.#err();
    }
  }

  async getProperty(account) {
    try {
      const query = {
        filter: {
          account,
        },
      };

      const { document } = await dataApi(dbName, "findOne", query);
      return document;
    } catch (err) {
      console.log(err);
      return this.#err();
    }
  }

  async getComps(account) {
    try {
      const subjectProperty = await this.getProperty(account);
      const hoodCode = subjectProperty.hoodCode;
      const sqFt = subjectProperty.sqFt;
      const accrDepPct = subjectProperty.accrDepPct;
      const cadAdj = subjectProperty.cadAdj;
      const cduAdj = subjectProperty.cduAdj;
      const grdAdj = subjectProperty.grdAdj;
      const imprvVal = subjectProperty.imprvVal;

      let pipelineArrMatch = [
        { hoodCode: hoodCode },
        { accrDepPct: { $lt: 1.0 } },
        {
          $and: [{ sqFt: { $lt: sqFt * 1.1 } }, { sqFt: { $gt: sqFt * 0.9 } }],
        },
        {
          $and: [
            { accrDepPct: { $lt: accrDepPct + 0.05 } },
            { accrDepPct: { $gt: accrDepPct - 0.05 } },
          ],
        },
        {
          $and: [
            { imprvVal: { $lt: imprvVal * 1.25 } },
            { imprvVal: { $gt: imprvVal * 0.75 } },
          ],
        },
        { account: { $ne: account } },
      ];

      if (cadAdj) {
        pipelineArrMatch.push({
          $and: [
            { cadAdj: { $lt: cadAdj * 1.15 } },
            { cadAdj: { $gt: cadAdj * 0.85 } },
          ],
        });
      }
      if (cduAdj) {
        pipelineArrMatch.push({
          $and: [
            { cduAdj: { $lt: cduAdj + 0.05 } },
            { cduAdj: { $gt: cduAdj - 0.05 } },
          ],
        });
      }
      if (grdAdj) {
        pipelineArrMatch.push({
          $and: [
            { grdAdj: { $lt: grdAdj * 1.15 } },
            { grdAdj: { $gt: grdAdj * 0.85 } },
          ],
        });
      }

      const query = {
        pipeline: [
          {
            $match: {
              $and: pipelineArrMatch,
            },
          },
          {
            $project: {
              account: 1,
              address: { $concat: ["$addr1", ", ", "$addr2", ", ", "$addr3"] },
              hoodCode: 1,
              sqFt: 1,
              landValue: 1,
              imprvVal: 1,
              marketValue: 1,
              xFeatures: 1,
              imprvValNoXf: 1,
              yrUpdated: 1,
              cadAdj: 1,
              cadDesc: 1,
              cduAdj: 1,
              cduDesc: 1,
              grdAdj: 1,
              grdDesc: 1,
              cadAdjust: {
                $cond: [
                  { $eq: [cadAdj, 0] },
                  { $add: [0, 0] },
                  {
                    $round: [
                      {
                        $subtract: [
                          {
                            $multiply: [
                              { $divide: ["$imprvValNoXf", "$cadAdj"] },
                              cadAdj,
                            ],
                          },
                          "$imprvValNoXf",
                        ],
                      },
                      2,
                    ],
                  },
                ],
              },
              cduAdjust: {
                $cond: [
                  { $eq: [cduAdj, 0] },
                  { $add: [0, 0] },
                  {
                    $round: [
                      {
                        $subtract: [
                          {
                            $multiply: [
                              { $divide: ["$imprvValNoXf", "$cduAdj"] },
                              cduAdj,
                            ],
                          },
                          "$imprvValNoXf",
                        ],
                      },
                      2,
                    ],
                  },
                ],
              },
              grdAdjust: {
                $cond: [
                  { $eq: [grdAdj, 0] },
                  { $add: [0, 0] },
                  {
                    $round: [
                      {
                        $subtract: [
                          {
                            $multiply: [
                              { $divide: ["$imprvValNoXf", "$grdAdj"] },
                              grdAdj,
                            ],
                          },
                          "$imprvValNoXf",
                        ],
                      },
                      2,
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              account: 1,
              address: 1,
              hoodCode: 1,
              sqFt: 1,
              landValue: 1,
              imprvVal: 1,
              marketValue: 1,
              xFeatures: 1,
              imprvValNoXf: 1,
              yrUpdated: 1,
              cadAdj: 1,
              cadDesc: 1,
              cduAdj: 1,
              cduDesc: 1,
              grdAdj: 1,
              grdDesc: 1,
              cadAdjust: 1,
              cduAdjust: 1,
              grdAdjust: 1,
              adjImpValue: {
                $round: [
                  {
                    $add: [
                      "$cadAdjust",
                      "$cduAdjust",
                      "$grdAdjust",
                      "$imprvValNoXf",
                    ],
                  },
                  2,
                ],
              },
              adjSqFtValue: {
                $round: [
                  {
                    $divide: [
                      {
                        $add: [
                          "$cadAdjust",
                          "$cduAdjust",
                          "$grdAdjust",
                          "$imprvValNoXf",
                        ],
                      },
                      "$sqFt",
                    ],
                  },
                  2,
                ],
              },
            },
          },
          {
            $sort: {
              adjSqFtValue: 1,
            },
          },
          {
            $limit: 10,
          },
        ],
      };

      const { documents } = await dataApi(dbName, "aggregate", query);
      return { subjectProperty, comps: documents };
    } catch (err) {
      console.log(err);
      return this.#err();
    }
  }

  #err(details = null) {
    let errorResponse = {
      error: {
        status: 500,
        text: "Internal Server Error",
        description: "Unknown Error",
      },
    };
    if (details) errorResponse.error.details = details;

    return errorResponse;
  }
}
