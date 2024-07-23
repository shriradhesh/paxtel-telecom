const mongoose = require('mongoose')
const cms_about_pxtel_Schema = new mongoose.Schema({

           Heading : {
                 type : String
           },
           Description : {
             type : String
           }
}, {timestamps : true })


const cms_about_pxtel_Model = mongoose.model('cms_about_pxtel', cms_about_pxtel_Schema)

module.exports = cms_about_pxtel_Model