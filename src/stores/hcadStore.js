import { dataApi } from "../handlers/mongodb"

const dbName = "hcad"

export default class HcadStore {

    async getAccountID(address) {
        const addressArray = address.split(" ");
        const excludeWords = ['ST', 'LN', 'STREET', 'LANE', 'AVE', 'AVENUE', 'DR', 'DRIVE', 'JCT', 'JUNCTION', 'PKWY', 'PARKWAY', 'PL', 'PLACE', 'RD', 'ROAD', 'RTE', 'ROUTE'];
        
        //We need to parse this address
        const streetNum = addressArray[0];
        let streetName = '';

        for (var i=1; i < addressArray.length; i++) {
            if (excludeWords.indexOf(addressArray[i].toUpperCase()) < 0)
                streetName += ' ' + addressArray[i];
        }

        const query = { 
            pipeline: 
            [
                { $match: {
                    $and: [ 
                        { streetNum: { $numberLong: streetNum } },
                        { $text: { $search: streetName } }
                    ]
                }},
                { $project: { account: 1, owner: 1, addr1: 1, addr2: 1, addr3: 1, _id: 0 } }
            ]
        }

        const { documents } = await dataApi(dbName, "aggregate", query)
        return documents
    }

    async getProperty(account) {
        const query = {
            filter: {
                account
            }
        }

        const { document } = await dataApi(dbName, "findOne", query)
        return document
    }

    async getComps(account) {
        const subjectProperty = await this.getProperty(account)
        const hoodCode = subjectProperty.hoodCode
        const sqFt = subjectProperty.sqFt
        const accrDepPct = subjectProperty.accrDepPct
        const cadAdj = subjectProperty.cadAdj
        const cduAdj = subjectProperty.cduAdj
        const grdAdj = subjectProperty.grdAdj
        const imprvVal = subjectProperty.imprvVal

        const query = {
            pipeline: [
                {
                    $match: {
                        $and: [
                            { hoodCode: hoodCode },
                            { accrDepPct: { $lt: 1.00 } },
                            { $and: [
                                { sqFt: { $lt: sqFt * 1.10 } },
                                { sqFt: { $gt: sqFt * 0.90 } }
                            ]},
                            { $and: [
                                { accrDepPct: { $lt: accrDepPct + 0.05 } },
                                { accrDepPct: { $gt: accrDepPct - 0.05 } }
                            ]},
                            { $and: [
                                { cadAdj: { $lt: cadAdj * 1.15 } },
                                { cadAdj: { $gt: cadAdj * 0.85 } }
                            ]},
                            {$and: [
                                { cduAdj: { $lt: cduAdj + 0.05 } },
                                { cduAdj: { $gt: cduAdj - 0.05 } }
                            ]},
                            {$and: [
                                { grdAdj: { $lt: grdAdj * 1.15 } },
                                { grdAdj: { $gt: grdAdj * 0.85 } }
                            ]},
                            {$and: [
                                { imprvVal: { $lt: imprvVal * 1.25 } },
                                { imprvVal: { $gt: imprvVal * 0.75 } }
                            ]},
                            { account: { $ne: account } }
                        ]
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
                        cadAdjust: { $round: [{ $subtract: [ { $multiply: [ { $divide: ["$imprvValNoXf", "$cadAdj"] }, cadAdj ] }, "$imprvValNoXf" ] }, 2] },
                        cduAdjust: { $round: [{ $subtract: [ { $multiply: [ { $divide: ["$imprvValNoXf", "$cduAdj"] }, cduAdj ] }, "$imprvValNoXf" ] }, 2] },
                        grdAdjust: { $round: [{ $subtract: [ { $multiply: [ { $divide: ["$imprvValNoXf", "$grdAdj"] }, grdAdj ] }, "$imprvValNoXf" ] }, 2] },
                    }
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
                        adjImpValue: { $round: [{ $add: ["$cadAdjust", "$cduAdjust", "$grdAdjust", "$imprvValNoXf"] }, 2] },
                        adjSqFtValue: { $round: [{ $divide: [{ $add: ["$cadAdjust", "$cduAdjust", "$grdAdjust", "$imprvValNoXf"] }, "$sqFt"] }, 2] }
                    }
                },
                {
                    $sort: {
                        adjSqFtValue: 1
                    }
                },
                {
                    $limit: 10
                }
            ]
        }

        const { documents } = await dataApi(dbName, "aggregate", query)
        return { subjectProperty, comps: documents}
    }
}