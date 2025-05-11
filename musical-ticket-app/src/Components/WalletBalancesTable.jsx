import React from 'react';
import styled from 'styled-components';
import { ActionButton } from '../Pages/CreateWallet';
import { ArrowClockwise } from "@phosphor-icons/react";

const BalancesTable = styled.table`
  width: 50%;
  border-collapse: collapse;
  margin: 20px 0;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background-color: #ff9c59;
  color: white;
`;

const TableHeaderCell = styled.th`
  padding: 12px 15px;
  text-align: center;
  font-weight: 500;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
  
  /* Only apply hover effect to tbody rows, not thead rows */
  tbody & {
    &:hover {
      background-color: #fff8f3;
    }
  }
  
  &:last-child {
    border-bottom: none;
  }

`;

const TableCell = styled.td`
  padding: 12px 15px;
`;

const AddressCell = styled(TableCell)`
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  max-width: 350px;
`;

const RefreshButton = styled(ActionButton)`
  margin: 20px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
`;

function WalletBalancesTable({ walletBalances, isLoading, refreshBalances, excludeVenue = true }) {
    // Filter out venue wallets if excludeVenue is true
    const displayBalances = excludeVenue 
        ? walletBalances.filter(item => !item.isVenue) 
        : walletBalances;
    
    return (
        <>
            <RefreshButton onClick={refreshBalances} disabled={isLoading}>
                <ArrowClockwise size={20} weight="bold" /> 
                {isLoading ? "Loading Balances..." : "Refresh Wallet Balances"}
            </RefreshButton>
            
            <BalancesTable>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell>Wallet Address</TableHeaderCell>
                        <TableHeaderCell>Ticket Balance</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {displayBalances.length > 0 ? (
                        displayBalances.map((item, index) => (
                            <TableRow key={index}>
                                <AddressCell>
                                    {item.address}
                                </AddressCell>
                                <TableCell>{item.balance}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        isLoading ? null : (
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <NoDataMessage>No wallet balances found. Click refresh to load data.</NoDataMessage>
                                </TableCell>
                            </TableRow>
                        )
                    )}
                </tbody>
            </BalancesTable>
        </>
    );
}

export default WalletBalancesTable;
