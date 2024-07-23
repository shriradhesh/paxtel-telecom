const mongoose = require('mongoose');

const simProductSchema = new mongoose.Schema({
    sim_number : {
        type : Number
    },
    user_email : {
          type : String
    },
    selectedCategories: {
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categorie',
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        }
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive' , 'plan Expire'] ,
        default : 'active'
    }
}, { timestamps: true });

const SimProduct = mongoose.model('SimProduct', simProductSchema);

module.exports = SimProduct;
