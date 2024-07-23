const mongoose = require('mongoose')
const cms_our_visionSchema = new mongoose.Schema({
          

               Heading : {
                       type : String
               },
               Description : {
                    type : String
               }
              

}, {timestamps : true })

const cms_our_vision_Model = mongoose.model('cms_our_vision', cms_our_visionSchema)

module.exports = cms_our_vision_Model