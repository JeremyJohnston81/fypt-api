import { dataApi } from "../handlers/mongodb"
import HcadStore from './hcadStore'

const hcad = new HcadStore()

export default class ReportStore {

    async getCompReport(county, account) {

        // const fonts = {
        //     Roboto: {
        //         normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
        //         bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
        //         italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
        //         bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
        //     }
        // }
        // const printer = new PdfPrinter(fonts)

        const { subjectProperty: subjectProperty, comps: comps } = await hcad.getComps(account)

        const compCount = comps.length
        let compAvgSqFtPrice
        
        if (compCount > 0) {
            //Find the Median SqFt Price
            if (compCount % 2 == 0) { //It's even - we need to avg the middle numbers
                compAvgSqFtPrice = (comps[compCount / 2].adjSqFtValue + comps[(compCount / 2) - 1].adjSqFtValue) / 2
            }
            else {
                compAvgSqFtPrice = comps[(compCount - 1) / 2].adjSqFtValue
            }
        }
        else {
            compAvgSqFtPrice = subjectProperty.priceSqFt
        }

        if (subjectProperty.taxRate == 0) {
            subjectProperty.taxRate = 2.5
        }

        const subjectPropertyAdjustedPrice = (subjectProperty.sqFt * compAvgSqFtPrice) + subjectProperty.landValue + subjectProperty.xFeatures
        const taxSavings = (subjectProperty.marketValue - subjectPropertyAdjustedPrice) * (subjectProperty.taxRate / 100) < 0 ?
                            0 : (subjectProperty.marketValue - subjectPropertyAdjustedPrice) * (subjectProperty.taxRate / 100)

        subjectProperty.address = `${subjectProperty.addr1}, ${subjectProperty.addr2}, ${subjectProperty.addr3}`

        const subjectData = [['Account\n----------\nAddress','Neigbr Code','Built/Remodel\n----------\nDEPR','CAD Desc\n----------\nCAD','CDU Desc\n----------\nCDU','Grade Desc\n----------\nGrade','SqFt','Land $','Imprv $\n----------\nXtra Feat','Market $']];

        const subjectDataRow = [];

        subjectDataRow.push(subjectProperty.account + '\n' + subjectProperty.addr1)
        subjectDataRow.push(subjectProperty.hoodCode)
        subjectDataRow.push(subjectProperty.yrUpdated)
        subjectDataRow.push(subjectProperty.cadDesc.substr(0,13) + '\n' + subjectProperty.cadAdj)
        subjectDataRow.push(subjectProperty.cduDesc + '\n' + subjectProperty.cduAdj)
        subjectDataRow.push(subjectProperty.grdDesc + '\n' + subjectProperty.grdAdj)
        subjectDataRow.push(subjectProperty.sqFt)
        subjectDataRow.push(subjectProperty.landValue.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,'))
        subjectDataRow.push(subjectProperty.imprvVal.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,') + '\n' + subjectProperty.xFeatures.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,'))
        subjectDataRow.push(subjectProperty.marketValue.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,'))
    
        subjectData.push(subjectDataRow)

        const docDefinition = {
            info: {
            	title: 'Property Tax Comparable Report',
            	author: 'FIGHT YOUR PROPERTY TAXES LLC',
            	creator: 'FIGHT YOUR PROPERTY TAXES LLC',
            	producer: 'FIGHT YOUR PROPERTY TAXES LLC',
            },
            pagesize: 'LETTER',
            pageOrientation: 'landscape',
            footer: [
                        [{margin: [20,0,0,0], justify: 'right', fontSize: 6, text: 'Report Generated ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').substr(0, 10), style: 'coverPage', marginBottom: 20}]
                    ],
            /************* PAGE 1 - Cover Page ************/
            content: [
                {text: 'Property Tax Comparable Report', style: 'coverPage', fontSize: 20, marginBottom: 10, marginTop: 130},
                {text: subjectProperty.account, style: 'coverPage'},
                {text: subjectProperty.owner, style: 'coverPage'},
                {text: subjectProperty.address, style: 'coverPage', marginBottom: 10},
                {
                    style: 'coverPage',
                    table: {
                        headerRows: 0,
                        widths: ['auto', 'auto'],
                        body: [
                            [{text: 'Year Built / Updated:'}, {text: subjectProperty.yrUpdated}],
                            [{text: 'Cost and Design (CAD):'}, {text: subjectProperty.cadDesc}],
                            [{text: 'Condition, Desirability, and Utility (CDU):'}, {text: subjectProperty.cduDesc}],
                            [{text: 'Grade:'}, {text: subjectProperty.grdDesc}],
                            [{text: 'Appaised Market Value:'}, {text: '$' + subjectProperty.marketValue.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,')}],
                            [{text: 'Fair Market Value:'}, {text: '$' + subjectPropertyAdjustedPrice.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,')}]
                        ]
                    },
                    layout: 'noBorders'
                }
            ],
            /************ STYLES ***************/
            styles: {
                coverPage: {
                    margin: [230, 0, 0, 0]
                },
                uandePage: {
                    margin: [100, 10, 100, 0],
                    fontSize: 12
                },
                compTable: {
                    margin: [0, 10, 0, 10],
                    fontSize : 8,
                    alignment: 'right'
                },
                summaryTable: {
                    margin: [500, 0, 0, 0],
                    alignment: 'right',
                    fontSize: 10
                }
            }
        }

        // const pdfDoc = pdfMake.createPdf(docDefinition);
        // pdfDoc.getBlob((blob) => {
        //     console.log(blob)
        // });
        //await REPORTSTORAGE.put(account + ".pdf", pdfDoc.write)
        // pdfDoc.pipe(fs.createWriteStream('example.pdf'));
        // pdfDoc.end();

        return {
            adjustedPrice: subjectPropertyAdjustedPrice,
            avgSqFt: compAvgSqFtPrice,
            taxSavings
        }

    }
}