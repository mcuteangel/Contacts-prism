import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfessionalInfoSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">اطلاعات شغلی</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="position">سمت شغلی</Label>
          <Input
            id="position"
            {...register('position')}
            placeholder="مثال: مدیر فنی"
            className={errors.position ? 'border-red-500' : ''}
          />
          {errors.position && (
            <p className="text-sm text-red-500">
              {String(errors.position.message || '')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">شرکت</Label>
          <Input
            id="company"
            {...register('company')}
            placeholder="نام شرکت"
            className={errors.company ? 'border-red-500' : ''}
          />
          {errors.company && (
            <p className="text-sm text-red-500">
              {String(errors.company.message || '')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
