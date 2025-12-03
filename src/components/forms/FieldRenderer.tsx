import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField, FormFieldType } from "@/types/insuranceForm";
import { cn } from "@/lib/utils";

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldRenderer({ field, value, onChange, error, disabled }: FieldRendererProps) {
  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  const baseInputClass = cn(
    "transition-colors",
    error && "border-destructive focus-visible:ring-destructive"
  );

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
      case 'phone':
      case 'email':
      case 'ssn':
      case 'vin':
        return (
          <Input
            type={field.field_type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
            rows={3}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            <Label htmlFor={field.name} className="text-sm font-normal cursor-pointer">
              {field.help_text || field.label}
            </Label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={baseInputClass}>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={handleChange}
            disabled={disabled}
            className="flex flex-wrap gap-4"
          >
            {field.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
                <Label htmlFor={`${field.name}-${option.value}`} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleChange([...selectedValues, option.value]);
                    } else {
                      handleChange(selectedValues.filter((v: string) => v !== option.value));
                    }
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={`${field.name}-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );
    }
  };

  // Checkbox renders its own label inline
  if (field.field_type as string === 'checkbox') {
    return (
      <div className={cn("space-y-1", field.grid_cols === 2 && "col-span-2")}>
        {renderField()}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", field.grid_cols === 2 && "col-span-2")}>
      <Label htmlFor={field.name} className="text-sm font-medium">
        {field.label}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {field.help_text && field.field_type !== 'checkbox' && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
