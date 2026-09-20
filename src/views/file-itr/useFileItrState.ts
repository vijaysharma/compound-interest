import { useState, useMemo, useRef, ChangeEvent, DragEvent } from 'react';
import {
  Form16ExtractedData,
  DEFAULT_SAMPLE_FORM16,
  EMPTY_FORM16_DATA,
} from './types';
import { parseForm16Text } from './parseForm16';
import { downloadItrSummary } from './exportItrSummary';
import { computeFileItrComparison } from './computeFileItrComparison';
const NUMERIC_FIELDS: (keyof Form16ExtractedData)[] = [
  'grossSalary',
  'basicSalary',
  'hraReceived',
  'rentPaid',
  'exemptAllowances',
  'standardDeduction',
  'professionalTax',
  'section80C',
  'section80Ccd1b',
  'section80D',
  'section80E',
  'section80G',
  'section80Tta',
  'otherDeductions',
  'otherIncome',
  'tdsDeducted',
];
export function useFileItrState() {
  const [formData, setFormData] = useState<Form16ExtractedData>(DEFAULT_SAMPLE_FORM16);
  const [fileName, setFileName] = useState<string>('Sample_Form_16_Part_B.pdf');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSampleLoaded, setIsSampleLoaded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleParsedText = (text: string) => {
    const data = parseForm16Text(text);
    setFormData((prev) => ({
      ...prev,
      ...data,
      basicSalary: data.basicSalary || Math.round((data.grossSalary || prev.grossSalary) * 0.5),
    }));
  };
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsSampleLoaded(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') handleParsedText(content);
    };
    reader.readAsText(file);
  };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsSampleLoaded(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') handleParsedText(content);
      };
      reader.readAsText(file);
    }
  };
  const loadSampleForm16 = () => {
    setFormData(DEFAULT_SAMPLE_FORM16);
    setFileName('Sample_Form_16_Infosys.pdf');
    setIsSampleLoaded(true);
  };
  const resetForm = () => {
    setFileName('');
    setFormData(EMPTY_FORM16_DATA);
  };
  const updateField = (field: keyof Form16ExtractedData, val: string | number) => {
    if (NUMERIC_FIELDS.includes(field)) {
      const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) || 0 : Number(val) || 0;
      setFormData((prev) => ({ ...prev, [field]: num }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: String(val) }));
    }
  };
  const taxComparison = useMemo(() => computeFileItrComparison(formData), [formData]);
  const recommendedResult =
    taxComparison.recommendedRegime === 'new' ? taxComparison.newRegime : taxComparison.oldRegime;
  const refundDifference = formData.tdsDeducted - recommendedResult.totalTaxPayable;
  const isRefundDue = refundDifference > 0;
  const isBalanceTaxPayable = refundDifference < 0;
  const handleDownload = () => {
    downloadItrSummary({
      formData,
      taxComparison,
      recommendedResult,
      refundDifference,
      isRefundDue,
      isBalanceTaxPayable,
    });
  };
  return {
    formData,
    fileName,
    isDragOver,
    setIsDragOver,
    isSampleLoaded,
    fileInputRef,
    handleFileUpload,
    handleDrop,
    loadSampleForm16,
    resetForm,
    updateField,
    taxComparison,
    recommendedResult,
    refundDifference,
    isRefundDue,
    isBalanceTaxPayable,
    handleDownload,
  };
}
