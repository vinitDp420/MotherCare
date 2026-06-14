import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreatePatient } from '@/hooks/usePatients'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  dob: z.string().refine((val) => {
    const date = new Date(val)
    return date < new Date()
  }, 'Date of birth must be in the past'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number (7-20 digits)'),
  alt_phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPatientPage() {
  const navigate = useNavigate()
  const { mutate: createPatient, isPending, error } = useCreatePatient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      blood_group: 'UNKNOWN',
    },
  })

  const onSubmit = (data: RegisterFormValues) => {
    // Sanitize optional blank fields to undefined
    const payload = {
      ...data,
      alt_phone: data.alt_phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
    }

    createPatient(payload, {
      onSuccess: (newPatient) => {
        navigate(`/patients/${newPatient.id}`)
      },
      onError: (err: any) => {
        if (err.errors) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            setError(field as any, { type: 'server', message })
          })
        }
      },
    })
  }

  return (
    <div className="p-margin-desktop max-w-4xl mx-auto space-y-gutter">
      {/* Breadcrumbs */}
      <nav className="flex text-label-md text-secondary dark:text-outline-variant gap-xs items-center mb-sm">
        <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/patients')}>Patients</a>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface font-bold">Register Patient</span>
      </nav>

      <div className="bg-white dark:bg-surface-dim rounded-xl shadow-ambient border border-outline-variant/20 overflow-hidden">
        {/* Form Header */}
        <div className="p-lg border-b border-outline-variant/10 bg-gradient-to-r from-brand-50 to-white dark:from-on-surface/5 dark:to-transparent">
          <h2 className="text-headline-md font-bold text-primary">Patient Intake Registration</h2>
          <p className="text-sm text-secondary mt-1">Please enter the patient demographics and contact details. All fields marked with * are mandatory.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-lg space-y-md">
          {error && (
            <div className="bg-error-container/20 border border-error-container text-error p-sm rounded-lg text-sm flex items-start gap-2">
              <span className="material-symbols-outlined mt-0.5">warning</span>
              <div>
                <p className="font-bold">Registration Failed</p>
                {(error as any).errors ? (
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    {Object.entries((error as any).errors).map(([field, messages]) => {
                      const fieldLabel = field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      return (messages as string[]).map((msg, i) => (
                        <li key={`${field}-${i}`}>
                          <strong>{fieldLabel}:</strong> {msg}
                        </li>
                      ))
                    })}
                  </ul>
                ) : (
                  <p>{(error as any).detail || 'Verify that the registration details are correct.'}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-neutral-700">Full Name *</label>
              <input
                type="text"
                {...register('full_name')}
                className={`form-input ${errors.full_name ? 'border-danger-500 focus:border-danger-500' : ''}`}
                placeholder="Jane Doe"
              />
              {errors.full_name && (
                <p className="text-xs text-danger-600 font-medium">{errors.full_name.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-neutral-700">Date of Birth *</label>
              <input
                type="date"
                {...register('dob')}
                className={`form-input ${errors.dob ? 'border-danger-500 focus:border-danger-500' : ''}`}
              />
              {errors.dob && (
                <p className="text-xs text-danger-600 font-medium">{errors.dob.message}</p>
              )}
            </div>

            {/* Blood Group */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-neutral-700">Blood Group *</label>
              <select
                {...register('blood_group')}
                className="form-input"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-neutral-700">Primary Phone *</label>
              <input
                type="tel"
                {...register('phone')}
                className={`form-input ${errors.phone ? 'border-danger-500 focus:border-danger-500' : ''}`}
                placeholder="+91 9876543210"
              />
              {errors.phone && (
                <p className="text-xs text-danger-600 font-medium">{errors.phone.message}</p>
              )}
            </div>

            {/* Alternate Phone */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-neutral-700">Alternate Phone</label>
              <input
                type="tel"
                {...register('alt_phone')}
                className="form-input"
                placeholder="Alternate contact (optional)"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-neutral-700">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className={`form-input ${errors.email ? 'border-danger-500 focus:border-danger-500' : ''}`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-xs text-danger-600 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-neutral-700">Residential Address</label>
            <textarea
              rows={3}
              {...register('address')}
              className="form-input"
              placeholder="Full mailing address details"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn-secondary px-lg"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-lg flex items-center gap-xs"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Registering...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  Register Patient
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
