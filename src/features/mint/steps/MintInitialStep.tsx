import { Divider } from "@material-ui/core";
import React, { FunctionComponent, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionButton,
  ActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import {
  AssetDropdown,
  AssetDropdownWrapper,
} from "../../../components/dropdowns/AssetDropdown";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import {
  BigCurrencyInput,
  BigCurrencyInputWrapper,
} from "../../../components/inputs/BigCurrencyInput";
import { PaperContent } from "../../../components/layout/Paper";
import { CenteredProgress } from "../../../components/progress/ProgressHelpers";
import { AssetInfo } from "../../../components/typography/TypographyHelpers";
import { useSelectedChainWallet } from "../../../providers/multiwallet/multiwalletHooks";
import {
  getCurrencyConfig,
  supportedLockCurrencies,
  supportedMintDestinationChains,
  toMintedCurrency,
} from "../../../utils/assetConfigs";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";
import { useRenNetworkTracker } from "../../transactions/transactionsHooks";
import {
  isMinimalAmount,
  TxConfigurationStepProps,
  TxType,
} from '../../transactions/transactionsUtils'
import {
  $wallet,
  setChain,
  setWalletPickerOpened,
} from "../../wallet/walletSlice";
import {
  $mint,
  $mintUsdAmount,
  setMintAmount,
  setMintCurrency,
} from "../mintSlice";

export const MintInitialStep: FunctionComponent<TxConfigurationStepProps> = ({
  onNext,
}) => {
  const dispatch = useDispatch();

  const { currency, amount } = useSelector($mint);
  const { chain } = useSelector($wallet);
  const { walletConnected } = useSelectedChainWallet();
  const { fees, pending } = useFetchFees(currency, TxType.MINT);
  const { conversionTotal } = getTransactionFees({
    amount,
    type: TxType.MINT,
    fees,
  });
  const currencyUsdValue = useSelector($mintUsdAmount);

  const handleAmountChange = useCallback(
    (value) => {
      dispatch(setMintAmount(value));
    },
    [dispatch]
  );
  const handleCurrencyChange = useCallback(
    (event) => {
      dispatch(setMintCurrency(event.target.value));
    },
    [dispatch]
  );
  const handleChainChange = useCallback(
    (event) => {
      dispatch(setChain(event.target.value));
    },
    [dispatch]
  );

  const renCurrency = toMintedCurrency(currency);
  useRenNetworkTracker(renCurrency);

  const canProceed =
    !!amount &&
    amount > 0 &&
    !pending &&
    isMinimalAmount(amount, conversionTotal);

  const handleNextStep = useCallback(() => {
    if (!walletConnected) {
      dispatch(setWalletPickerOpened(true));
    } else {
      if (onNext && canProceed) {
        onNext();
      }
    }
  }, [dispatch, onNext, walletConnected, canProceed]);

  const mintedCurrencySymbol = toMintedCurrency(currency);
  const mintedCurrencyConfig = getCurrencyConfig(mintedCurrencySymbol);
  const { GreyIcon } = mintedCurrencyConfig;

  return (
    <>
      <PaperContent bottomPadding>
        <BigCurrencyInputWrapper>
          <BigCurrencyInput
            onChange={handleAmountChange}
            symbol={currency}
            usdValue={currencyUsdValue}
            value={amount}
          />
        </BigCurrencyInputWrapper>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Send"
            mode="send"
            available={supportedLockCurrencies}
            value={currency}
            onChange={handleCurrencyChange}
          />
        </AssetDropdownWrapper>
        <AssetDropdownWrapper>
          <AssetDropdown
            label="Destination"
            mode="chain"
            available={supportedMintDestinationChains}
            value={chain}
            onChange={handleChainChange}
          />
        </AssetDropdownWrapper>
      </PaperContent>
      <Divider />
      <PaperContent darker topPadding bottomPadding>
        {walletConnected &&
          (pending ? (
            <CenteredProgress />
          ) : (
            <AssetInfo
              label="Receiving:"
              value={
                <NumberFormatText
                  value={conversionTotal}
                  spacedSuffix={mintedCurrencyConfig.short}
                />
              }
              Icon={<GreyIcon fontSize="inherit" />}
            />
          ))}
        <ActionButtonWrapper>
          <ActionButton onClick={handleNextStep} disabled={!canProceed}>
            {walletConnected ? "Next" : "Connect Wallet"}
          </ActionButton>
        </ActionButtonWrapper>
      </PaperContent>
    </>
  );
};
