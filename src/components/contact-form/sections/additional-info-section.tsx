import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AdditionalInfoSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">اطلاعات تکمیلی</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">یادداشت‌ها</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="یادداشت‌های مربوط به مخاطب"
            rows={3}
            className={errors.notes?.message ? 'border-red-500' : ''}
          />
          {errors.notes && (
            <p className="text-sm text-red-500">
              {String(errors.notes?.message || '')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
