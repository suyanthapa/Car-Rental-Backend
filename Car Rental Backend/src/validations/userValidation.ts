import Joi from "joi";

const userValidation = {
  bookVehicle: {
    body: Joi.object().keys({
      vehicleId: Joi.string().uuid().required().messages({
        "string.empty": "Vehicle ID is required",
        "string.guid": "Vehicle  ID must be a valid UUID",
      }),
      startDate: Joi.date().iso().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().iso().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  },
  viewSpecificVehicle: {
    params: Joi.object().keys({
      vehicleId: Joi.string().uuid().required().messages({
        "string.empty": "Vehicle ID is required",
        "string.guid": "Vehicle ID must be a valid UUID",
      }),
    }),
  },
  updatePassword: {
    body: Joi.object().keys({
      oldPassword: Joi.string().required().messages({
        "string.empty": "Old password is required",
      }),

      // New password with strength rules
      newPassword: Joi.string()
        .min(8)
        .max(30)

        .invalid(Joi.ref("oldPassword")) // Ensures new password is not same as old
        .required()
        .messages({
          "string.min": "New password must be at least 8 characters long",
          "any.invalid": "New password cannot be the same as the old password",
          "string.empty": "New password is required",
        }),
    }),
  },
};

export default userValidation;
