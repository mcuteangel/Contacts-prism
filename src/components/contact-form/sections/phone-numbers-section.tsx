import React from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

type PhoneNumber = {
  type: 'mobile' | 'home' | 'work' | 'other';
  number: string;
};

type FormValues = {
  phoneNumbers: PhoneNumber[];
};

export function PhoneNumbersSection({ dir }: { dir?: 'ltr' | 'rtl' }) {
  const { control, register, formState: { errors }, setValue } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });
  
  // Watch phone numbers to trigger re-renders
  const phoneNumbers = useWatch({ control, name: 'phoneNumbers' });

  const phoneTypes = [
    { value: 'mobile', label: 'موبایل' },
    { value: 'home', label: 'منزل' },
    { value: 'work', label: 'محل کار' },
    { value: 'other', label: 'سایر' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">شماره‌های تماس</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ type: 'mobile', number: '' })}
        >
          <Plus className="h-4 w-4 ml-1" />
          افزودن شماره
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          هنوز شماره‌ای اضافه نشده است
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`phone-type-${index}`}>نوع</Label>
                  <Select
                    dir={dir}
                    value={phoneNumbers?.[index]?.type || field.type}
                    onValueChange={(value: 'mobile' | 'home' | 'work' | 'other') => {
                      // Update the field value using setValue
                      setValue(`phoneNumbers.${index}.type`, value);
                    }}
                  >
                    <SelectTrigger id={`phone-type-${index}`} className="w-fit">
                      <SelectValue placeholder="انتخاب نوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {phoneTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`phone-number-${index}`}>شماره تماس</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`phone-number-${index}`}
                      {...register(`phoneNumbers.${index}.number`)}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className={errors.phoneNumbers && Array.isArray(errors.phoneNumbers) && errors.phoneNumbers[index]?.number?.message ? 'border-red-500' : ''}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {errors.phoneNumbers && Array.isArray(errors.phoneNumbers) && errors.phoneNumbers[index]?.number && (
                    <p className="text-sm text-red-500">
                      {String(errors.phoneNumbers[index]?.number?.message || '')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}