// Validation utility functions for the Highway Notes app

export const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
export const nameRegex = /^[a-zA-Z\s]+$/;
export const otpRegex = /^\d{6}$/;

export const validationMessages = {
  email: {
    required: 'Email is required',
    invalid: 'Please provide a valid email address',
    exists: 'User already exists with this email'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters',
    pattern: 'Password must contain uppercase, lowercase, number, and special character'
  },
  name: {
    required: 'Name is required',
    minLength: 'Name must be at least 2 characters',
    maxLength: 'Name must be less than 50 characters',
    pattern: 'Name can only contain letters and spaces'
  },
  dateOfBirth: {
    required: 'Date of birth is required',
    invalid: 'Please provide a valid date of birth',
    future: 'Date of birth cannot be in the future'
  },
  otp: {
    required: 'OTP is required',
    length: 'OTP must be exactly 6 digits',
    numeric: 'OTP must contain only numbers'
  },
  confirmPassword: {
    required: 'Please confirm your password',
    match: 'Passwords do not match'
  },
  terms: {
    required: 'You must agree to the terms and conditions'
  }
};

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && nameRegex.test(name);
};

export const validateOTP = (otp: string): boolean => {
  return otp.length === 6 && otpRegex.test(otp);
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Form validation rules for react-hook-form
export const formValidationRules = {
  email: {
    required: validationMessages.email.required,
    pattern: {
      value: emailRegex,
      message: validationMessages.email.invalid
    }
  },
  password: {
    required: validationMessages.password.required,
    minLength: {
      value: 8,
      message: validationMessages.password.minLength
    },
    pattern: {
      value: passwordRegex,
      message: validationMessages.password.pattern
    }
  },
  name: {
    required: validationMessages.name.required,
    minLength: {
      value: 2,
      message: validationMessages.name.minLength
    },
    maxLength: {
      value: 50,
      message: validationMessages.name.maxLength
    },
    pattern: {
      value: nameRegex,
      message: validationMessages.name.pattern
    }
  },
  dateOfBirth: {
    validate: (value: string) => {
      if (!value) return true; // Allow empty values
      const date = new Date(value);
      const today = new Date();
      if (isNaN(date.getTime())) return validationMessages.dateOfBirth.invalid;
      if (date > today) return validationMessages.dateOfBirth.future;
      return true;
    }
  },
  otp: {
    required: validationMessages.otp.required,
    minLength: {
      value: 6,
      message: validationMessages.otp.length
    },
    maxLength: {
      value: 6,
      message: validationMessages.otp.length
    },
    pattern: {
      value: otpRegex,
      message: validationMessages.otp.numeric
    }
  }
};
