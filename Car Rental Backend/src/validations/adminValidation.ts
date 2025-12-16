import Joi from "joi";

const adminValidation = {
  addCar: {
    body: Joi.object().keys({
      name: Joi.string().min(2).max(150).required().messages({
        "string.empty": "Name is required",
        "string.min": "Name must contain altleast 2 characters long",
        "string.max": "Name mustnot exceed 150 characters long",
      }),
      brand: Joi.string().required().messages({
        "string.empty": "Brand is required",
      }),
      fuelType: Joi.string()
        .valid("PETROL", "DIESEL", "ELECTRIC", "HYBRID")
        .required()
        .messages({
          "string.empty": "Fuel type is required",
        }),
      pricePerDay: Joi.number().positive().required().messages({
        "number.base": "Price per day must be a number",
        "any.required": "Price per day is required",
      }),
      seats: Joi.number().integer().min(2).max(10).required().messages({
        "number.base": "Seats must be a number",
        "any.required": "Seats is required",
      }),
      type: Joi.string()
        .valid("SEDAN", "SUV", "HATCHBACK", "VAN", "TRUCK")
        .min(3)
        .max(50)
        .required()
        .messages({
          "string.empty": "Type is required",
        }),
    }),
  },
};

export default adminValidation;
