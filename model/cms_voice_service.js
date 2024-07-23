const mongoose = require('mongoose')
const cms_our_voice_service_schema = new mongoose.Schema({
          

               Heading : {
                       type : String
               },
               Description : {
                    type : String
               }
              

}, {timestamps : true })

const cms_our_voice_service_Model = mongoose.model('cms_our_voice_service', cms_our_voice_service_schema)

module.exports = cms_our_voice_service_Model