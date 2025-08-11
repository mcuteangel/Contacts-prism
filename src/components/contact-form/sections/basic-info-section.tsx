import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BasicInfoSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">اطلاعات پایه</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="firstName">نام</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="نام مخاطب"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message as string}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="lastName">نام خانوادگی</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="نام خانوادگی مخاطب"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}
