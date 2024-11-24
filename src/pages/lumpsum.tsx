import { useEffect, useState } from "react";
import DisplayCard from "../components/DisplayCard.tsx";
import InputAmount from "../components/InputAmount.tsx";
import RateOfInterest from "../components/RateOfInterest.tsx";
import Tenure from "../components/Tenure.tsx";
import JoinedButtonGroup from "../components/JoinedButtonGroup.tsx";
import { RT, StepAmountType } from "../types/types.ts";
import { calculateInterest, calculatePrincipal } from "../utilities/utility.ts";
import {
  FREQUENCY_DATA,
  PA,
  PAYOUT_MODE_DATA,
  RATE_TENURE,
  STEP_AMOUNT,
} from "../data/default_data.ts";

const Lumpsum = () => {
  const [pa, setPa] = useState(PA);
  const [rt, setRt] = useState<RT>(RATE_TENURE);
  const [mode, setMode] = useState("1");
  const [frequency, setFrequency] = useState("4");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [invType, setInvType] = useState("inv");
  const stepData: StepAmountType[] = STEP_AMOUNT;
  useEffect(() => {
    const rtRoi = rt.roi ? rt.roi : "0";
    const finalAmount =
      invType === "tgt"
        ? calculatePrincipal(pa, rtRoi, frequency, rt.tenure, rt.tenureFormat)
        : calculateInterest(
            pa,
            rtRoi,
            mode,
            frequency,
            rt.tenure,
            rt.tenureFormat
          );
    if (mode === "100" && invType === "inv") {
      setPayoutAmount(Math.round(finalAmount) + Math.round(parseFloat(pa)));
    } else {
      setPayoutAmount(Math.round(finalAmount));
    }
  }, [pa, rt, rt.tenure, rt.tenureFormat, mode, invType, frequency]);
  return (
    <>
      <InputAmount
        className="mb-3"
        inputAmount={pa}
        setInputAmount={setPa}
        type={invType}
        setType={setInvType}
        typeData={[
          { id: "ty1", value: "inv", title: "One time amount" },
          { id: "ty2", value: "tgt", title: "Target amount" },
        ]}
        stepData={stepData}
        stepSizePrefix={"sm"}
        title={invType === "tgt" ? "Target amount" : ""}
      />
      <RateOfInterest className="mb-3" rt={rt} setRt={setRt} />
      <Tenure className="mb-3" rt={rt} setRt={setRt} />
      <JoinedButtonGroup
        className="mb-3"
        data={FREQUENCY_DATA}
        sizePrefix="sm"
        selectedValue={frequency}
        updateSelectedValue={setFrequency}
        title="Compounded"
      />
      {invType === "inv" && (
        <JoinedButtonGroup
          className="mb-3"
          data={PAYOUT_MODE_DATA}
          sizePrefix="sm"
          selectedValue={mode}
          updateSelectedValue={setMode}
          title="Payout Mode"
        />
      )}
      <DisplayCard
        primaryAmount={payoutAmount}
        title={invType === "tgt" ? "Lumpsum amount required" : ""}
      />
    </>
  );
};
export default Lumpsum;
