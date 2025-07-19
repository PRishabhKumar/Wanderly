const joi = require('joi')

module.exports.listingSchema = joi.object({
    listing: joi.object({
        title: joi.string().required(),
        description: joi.string().required(),
        location: joi.string().required(),
        country: joi.string().required(),
        price: joi.number().min(0), // this will prevent negative prices
        image: joi.object({
            url: joi.string().uri().allow("", null)
        }).optional()
    }).required()
})