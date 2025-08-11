import React, { useState } from 'react';
import { useFieldArray, useFormContext, FieldError } from 'react-hook-form';

type CustomFieldError = {
  value?: {
    message?: string;
  };
};

type CustomFieldErrors = (CustomFieldError | undefined)[];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

type CustomField = {
  name: string;
  value: string;
  type?: 'text' | 'number' | 'date' | 'list';
  options?: string[];
};

type CustomFieldsSectionProps = {
  templates: Array<{
    id: number;
    name: string;
    type: 'text' | 'number' | 'date' | 'list';
    options?: string[];
    required: boolean;
  }>;
};

export function CustomFieldsSection({ templates }: CustomFieldsSectionProps) {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<{ customFields?: CustomField[] }>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFields',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const customFields: CustomField[] = watch('customFields') || [];
  const fieldErrors = (errors.customFields || []) as CustomFieldError[];

  const handleAddField = () => {
    if (!selectedTemplate) return;
    
    const templateId = Number(selectedTemplate);
    if (isNaN(templateId)) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    append({
      name: template.name,
      value: '',
      type: template.type,
      ...(template.options && { options: template.options })
    });
    
    setSelectedTemplate('');
  };

  const renderFieldInput = (field: CustomField, index: number) => {
    const fieldError = fieldErrors[index]?.value;

    switch (field.type) {
      case 'date':
        return (
          <Input
            type="date"
            {...register(`customFields.${index}.value`)}
            className={fieldError ? 'border-red-500' : ''}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            {...register(`customFields.${index}.value`)}
            className={fieldError ? 'border-red-500' : ''}
          />
        );
      case 'list':
        return (
          <Select
            onValueChange={(value) => setValue(`customFields.${index}.value`, value)}
            value={field.value || ''}
          >
            <SelectTrigger className={`${fieldError ? 'border-red-500' : ''} w-fit`}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default: // text
        return (
          <Input
            {...register(`customFields.${index}.value`)}
            className={fieldError ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">فیلدهای سفارشی</h3>
        <div className="flex gap-2">
          <Select
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="انتخاب فیلد" />
            </SelectTrigger>
            <SelectContent>
              {templates
                .filter(
                  (template) =>
                    !customFields.some((field: any) => field.name === template.name)
                )
                .map((template) => (
                  <SelectItem key={template.id} value={String(template.id)}>
                    {template.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddField}
            disabled={!selectedTemplate}
          >
            <Plus className="h-4 w-4 ml-1" />
            افزودن
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            فیلد سفارشی وجود ندارد
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
              <Label>{customFields[index]?.name}</Label>
              <div className="flex items-center gap-2">
                {renderFieldInput(customFields[index], index)}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-8 px-2"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {fieldErrors[index]?.value && (
                <div className="col-span-2 text-sm text-red-500">
                  {fieldErrors[index]?.value?.message || ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}