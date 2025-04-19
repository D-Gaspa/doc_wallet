import { useState, useCallback, useEffect } from "react"

interface ValidationRules<T> {
    [key: string]: (value: unknown, formValues: T) => string | null
}

/**
 * A hook for form validation with touched state tracking
 */
export function useFormValidation<T extends Record<string, unknown>>(
    initialValues: T,
    validationRules: ValidationRules<T>,
) {
    const [values, setValues] = useState<T>(initialValues)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [isFormValid, setIsFormValid] = useState(false)

    // Validate a single field
    const validateField = useCallback(
        (name: string, value: unknown): string | null => {
            if (!validationRules[name]) return null
            return validationRules[name](value, values)
        },
        [validationRules, values],
    )

    // Handle field change
    const handleChange = useCallback((name: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [name]: value }))
    }, [])

    // Mark field as touched
    const handleBlur = useCallback(
        (name: string) => {
            setTouched((prev) => ({ ...prev, [name]: true }))

            const error = validateField(name, values[name])
            setErrors((prev) => ({
                ...prev,
                [name]: error || "",
            }))
        },
        [validateField, values],
    )

    // Set form error (from API, etc.)
    const setFormError = useCallback((message: string) => {
        setErrors((prev) => ({ ...prev, form: message }))
    }, [])

    // Clear form error
    const clearFormError = useCallback(() => {
        setErrors((prev) => {
            // Using destructuring to avoid unused variable
            const newErrors = { ...prev }
            delete newErrors.form
            return newErrors
        })
    }, [])

    // Reset form
    const resetForm = useCallback(() => {
        setValues(initialValues)
        setErrors({})
        setTouched({})
    }, [initialValues])

    // Validate entire form
    const validateForm = useCallback(() => {
        const newErrors: Record<string, string> = {}
        let valid = true

        // Mark all fields as touched
        const newTouched = Object.keys(values).reduce((obj, field) => {
            obj[field] = true
            return obj
        }, {} as Record<string, boolean>)
        setTouched(newTouched)

        // Validate all fields
        Object.keys(values).forEach((key) => {
            const error = validateField(key, values[key])
            if (error) {
                newErrors[key] = error
                valid = false
            }
        })

        setErrors(newErrors)
        return valid
    }, [validateField, values])

    // Update form validity when values or errors change
    useEffect(() => {
        const fieldsWithRules = Object.keys(validationRules)
        const hasErrors = fieldsWithRules.some(
            (field) => touched[field] && validateField(field, values[field]),
        )
        setIsFormValid(!hasErrors)
    }, [values, touched, validateField, validationRules])

    return {
        values,
        errors,
        touched,
        isFormValid,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setFormError,
        clearFormError,
    }
}
