import React from 'react';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { UnitCategory } from './unitData';
import styles from '../UnitConverter.module.scss';
interface UnitCategoryButtonsProps {
  category: UnitCategory;
  onCategoryChange: (category: UnitCategory) => void;
}
const FIRST_GROUP = [
  { id: 'uc1', title: 'Length', value: 'Length' },
  { id: 'uc2', title: 'Area', value: 'Area' },
  { id: 'uc3', title: 'Weight', value: 'Weight' },
  { id: 'uc4', title: 'Volume', value: 'Volume' },
];
const SECOND_GROUP = [
  { id: 'uc5', title: 'Temperature', value: 'Temperature' },
  { id: 'uc6', title: 'Speed', value: 'Speed' },
  { id: 'uc7', title: 'Data', value: 'Data' },
];
export const UnitCategoryButtons: React.FC<UnitCategoryButtonsProps> = ({
  category,
  onCategoryChange,
}) => {
  return (
    <div className={styles.joinedButtonGroupContainer}>
      <JoinedButtonGroup
        data={FIRST_GROUP}
        selectedValue={category}
        updateSelectedValue={(val) => onCategoryChange(val as UnitCategory)}
        sizePrefix="sm"
      />
      <JoinedButtonGroup
        data={SECOND_GROUP}
        selectedValue={category}
        updateSelectedValue={(val) => onCategoryChange(val as UnitCategory)}
        sizePrefix="sm"
      />
    </div>
  );
};
