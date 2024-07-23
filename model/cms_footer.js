const mongoose = require('mongoose')
const cms_footer_contentSchema = new mongoose.Schema({
        
            
            Description : {
                 type : String
            }
}, {timestamps : true })

const cms_footer_contentModel = mongoose.model('cms_footer_content', cms_footer_contentSchema)

module.exports = cms_footer_contentModel