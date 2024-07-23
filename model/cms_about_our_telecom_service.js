const mongoose = require('mongoose')
const cms_our_telecom_service_Schema = new mongoose.Schema({
          

               Heading : {
                       type : String
               },
               Description : {
                    type : String
               }
              

}, {timestamps : true })

const cms_our_telecom_service_model = mongoose.model('cms_our_telecom_service', cms_our_telecom_service_Schema)

module.exports = cms_our_telecom_service_model