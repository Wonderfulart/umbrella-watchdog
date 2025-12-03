import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSection, LineOfBusiness } from "@/types/insuranceForm";
import { FieldRenderer } from "./FieldRenderer";
import { cn } from "@/lib/utils";

interface FormSectionRendererProps {
  section: FormSection;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  selectedLOB: LineOfBusiness[];
  disabled?: boolean;
}

export function FormSectionRenderer({
  section,
  values,
  onChange,
  errors = {},
  selectedLOB,
  disabled
}: FormSectionRendererProps) {
  const [isExpanded, setIsExpanded] = useState(section.is_expanded_default);

  // Filter fields based on selected line of business
  const visibleFields = section.fields?.filter(field => {
    // Show field if it has no LOB restriction or matches selected LOB
    if (!field.line_of_business || field.line_of_business.length === 0) {
      return true;
    }
    return field.line_of_business.some(lob => selectedLOB.includes(lob));
  }) || [];

  // Check if field should be shown based on conditional logic
  const shouldShowField = (field: typeof visibleFields[0]) => {
    if (!field.conditional_logic) return true;
    
    const { field: dependentField, operator, value: conditionValue } = field.conditional_logic;
    const dependentValue = values[dependentField];

    switch (operator) {
      case 'equals':
        return dependentValue === conditionValue;
      case 'notEquals':
        return dependentValue !== conditionValue;
      case 'contains':
        return String(dependentValue).includes(String(conditionValue));
      case 'greaterThan':
        return Number(dependentValue) > Number(conditionValue);
      case 'lessThan':
        return Number(dependentValue) < Number(conditionValue);
      default:
        return true;
    }
  };

  const displayedFields = visibleFields.filter(shouldShowField);

  // Don't render section if no fields to display
  if (displayedFields.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className={cn(
          "bg-muted/50 py-3",
          section.is_collapsible && "cursor-pointer hover:bg-muted/70 transition-colors"
        )}
        onClick={() => section.is_collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {section.is_collapsible && (
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {section.label}
          </CardTitle>
          {section.description && (
            <span className="text-sm text-muted-foreground">{section.description}</span>
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedFields
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.name]}
                  onChange={onChange}
                  error={errors[field.name]}
                  disabled={disabled}
                />
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
