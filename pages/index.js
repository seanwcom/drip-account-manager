import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useQueries } from 'react-query';
import Header from '../components/layouts/Header';
import PageContainer from '../components/layouts/PageContainer';
import TableLoader from '../components/placeholders/TableLoader';
import CollapsibleTableRow from '../components/CollapsibleTableRow';
import numberFormat from '../utils/numberFormat';

import { AddressDetailsComponent } from '../components/AddressDetailsComponent';
import { RollButton } from '../components/RollButton';
import { ClaimButton } from '../components/ClaimButton';
import { SwapButton } from '../components/SwapButton';
import Donate from '../components/Donate';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
    const [bnbDrip, setBnbDrip] = useState(0);
    const [bnbDripToUSDT, setBnbDripToUSDT] = useState(0);
    const [bnbToUSDT, setBnbToUSDT] = useState(0);
    const [accounts, setAccounts] = useState([]);

    const [showFullAddress, setShowFullAddress] = useState(false);

    const autoRefreshInterval = 3000;

    const getRates = () => axios.get('/api/rates');
    const getAccounts = () => axios.get('/api/accounts');
    const getInfo = address => axios.get(`/api/accounts/${address}`);

    useQuery('rates', getRates, {
        refetchInterval: autoRefreshInterval,
        onSuccess: response => {
            const { bnbDrip, bnbUsdt, bnbdripUsdt } = response.data;

            setBnbDrip(bnbDrip);
            setBnbDripToUSDT(bnbdripUsdt);
            setBnbToUSDT(bnbUsdt);
        },
    });

    const { isLoading } = useQuery('accounts', getAccounts, {
        refetchOnWindowFocus: false,
        onSuccess: response => setAccounts(response.data),
    });

    useQueries(
        accounts.map((account, index, arr) => {
            return {
                refetchInterval: autoRefreshInterval,
                queryKey: [`account${index}`, account.address],
                queryFn: () => getInfo(account.address),
                onSuccess: response => {
                    const currentAccount = {
                        ...account,
                        ...response.data,
                    };

                    setAccounts([
                        ...arr.slice(0, index),
                        currentAccount,
                        ...arr.slice(index + 1),
                    ]);
                },
            };
        })
    );

    return (
        <PageContainer>
            <ToastContainer />
            <Header title="DRIP Accounts Manager">
                <div className="flex flex-col lg:flex-row lg:space-x-5 tracking-wider font-semibold">
                    <div className="bg-sky-300 dark:bg-blue-300 text-gray-600 px-3 py-1 rounded-xl">BNB/DRIP ≈ <span className="text-gray-800">${numberFormat(bnbDripToUSDT, 2)} USDT</span></div>
                    <div className="bg-sky-300 dark:bg-blue-300 text-gray-600 px-3 py-1 rounded-xl">BNB/USDT ≈ <span className="text-gray-800">${numberFormat(bnbToUSDT, 2)}</span></div>
                </div>
                <div className="flex flex-col lg:flex-row lg:space-x-5 tracking-wider font-semibold">
                    <div className="bg-sky-300 dark:bg-blue-300 text-gray-600 px-3 py-1 rounded-xl"><span className="text-gray-800">{numberFormat(bnbDrip, 18)}</span> BNB/DRIP</div>
                </div>
            </Header>
            <div className="container px-0 xl:px-28 pt-16">
                {isLoading ? (
                    <TableLoader
                        headers={[
                            '#',
                            'Name',
                            'Address',
                            'BNB Balance',
                            'DRIP Balance',
                            'Deposits',
                            'Available Claim',
                        ]}
                        rowCount={10}
                    />
                ) : (
                    <>
                        <div className="table-container slim-scroll">
                            <table className="table">
                                <thead className="table-head">
                                    <tr className="table-actions">
                                        <th className="table-header">#</th>
                                        <th className="table-header">Name</th>
                                        <th className="table-header">
                                            Address
                                            <button
                                                className="text-sm text-sky-500 dark:text-blue-300 ml-1"
                                                title="Toggle between whole and shortened address"
                                                onClick={() => setShowFullAddress(!showFullAddress)}
                                            >
                                                ({!showFullAddress ? 'Shortened' : 'Whole'})
                                            </button>
                                        </th>
                                        <th className="table-header">BNB Balance</th>
                                        <th className="table-header">DRIP Balance</th>
                                        <th className="table-header">Deposits</th>
                                        <th className="table-header">Available Claim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        accounts?.map((account, index) => {
                                            const {
                                                // Row details
                                                id,
                                                accountName,
                                                bnbBalance = 0,
                                                tokenBalance = 0,
                                                deposits = 0,
                                                claims = 0,
                                                // Collapsible details
                                                buddy = 0,
                                                directs = 0,
                                                team = 0,
                                                airDropSent = 0,
                                                airDropReceived = 0,
                                                netDeposits = 0,
                                                isNetPositive,
                                                directRewards = 0,
                                                indirectRewards = 0,
                                            } = account;

                                            const bnbBalanceFormatted = `${numberFormat(bnbBalance, 4)} BNB`;
                                            const bnbBalanceInUsd = `USD: $${numberFormat(bnbBalance * bnbToUSDT, 2)}`;
                                            const tokenBalanceFormatted = numberFormat(tokenBalance, 4);
                                            const depositsFormatted = numberFormat(deposits, 3);
                                            const depositsInUsdt = `USD: $${numberFormat(deposits * bnbDripToUSDT, 2)}`;
                                            const claimsFormatted = numberFormat(claims, 10);
                                            const claimsInUsdt = `USD: $${numberFormat(claims * bnbDripToUSDT, 2)}`;

                                            return (
                                                <React.Fragment key={index}>
                                                    <CollapsibleTableRow
                                                        rowkey={id + index}
                                                        rowContent={
                                                            <>
                                                                <td className="table-data text-sky-500 dark:text-blue-300 rounded-tl-4xl">{id}</td>
                                                                <td className="table-data text-sky-500 dark:text-blue-300">{accountName}</td>
                                                                <td className="table-data">
                                                                    <AddressDetailsComponent
                                                                        account={account}
                                                                        showFullAddress={showFullAddress}
                                                                    />
                                                                </td>
                                                                <td className="table-data">
                                                                    <span className="block font-semibold text-sky-500 dark:text-blue-300">{bnbBalanceFormatted}</span>
                                                                    <span className="block text-sm">{bnbBalanceInUsd}</span>
                                                                </td>
                                                                <td className="table-data">
                                                                    <span className="block font-semibold text-sky-500 dark:text-blue-300">{tokenBalanceFormatted}</span>
                                                                </td>
                                                                <td className="table-data">
                                                                    <span className="block font-semibold text-sky-500 dark:text-blue-300">{depositsFormatted}</span>
                                                                    <span className="block text-sm">{depositsInUsdt}</span>
                                                                </td>
                                                                <td className="table-data rounded-tr-4xl">
                                                                    <span className="block font-semibold text-sky-500 dark:text-blue-300">{claimsFormatted}</span>
                                                                    <span className="block text-sm">{claimsInUsdt}</span>
                                                                </td>
                                                            </>
                                                        }
                                                        actionsContent={
                                                            <>
                                                                <RollButton account={account} />
                                                                <ClaimButton account={account} />
                                                                <SwapButton account={account} />
                                                            </>

                                                        }
                                                        collapsibleContent={
                                                            <td colSpan={7} className="p-5 rounded-b-4xl">
                                                                <div className="flex flex-row space-x-5 w-3/4 mx-auto">
                                                                    <div className="flex space-x-5 w-1/2">
                                                                        <div className="shadow-md bg-white dark:bg-gray-900 p-5 mb-5 w-full rounded-2xl">
                                                                            <div className="font-bold text-sm opacity-80">Buddy</div>
                                                                            <div className="text-sky-500 dark:text-blue-300 font-semibold mt-3 break-all">{buddy}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex space-x-5 w-1/2">
                                                                        <div className="shadow-md bg-white dark:bg-gray-900 p-5 mb-5 w-full rounded-2xl">
                                                                            <div className="font-bold text-sm opacity-80">Airdrops Sent / Received</div>
                                                                            <div className="text-sky-500 dark:text-blue-300 font-semibold mt-3 break-all">{numberFormat(airDropSent, 3)} / {numberFormat(airDropReceived, 3)}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-row space-x-5 w-3/4 mx-auto">
                                                                    <div className="flex space-x-5 w-1/2">
                                                                        <div className="shadow-md bg-white dark:bg-gray-900 p-5 mb-5 w-1/2 rounded-2xl">
                                                                            <div className="font-bold text-sm opacity-80">Directs / Team</div>
                                                                            <div className="text-sky-500 dark:text-blue-300 font-semibold mt-3 break-all">{directs} / {team}</div>
                                                                        </div>
                                                                        <div className="shadow-md bg-white dark:bg-gray-900 p-5 mb-5 w-1/2 rounded-2xl">
                                                                            <div className="font-bold text-sm opacity-80">Rewards Direct / Indirect</div>
                                                                            <div className="text-sky-500 dark:text-blue-300 font-semibold mt-3 break-all">{numberFormat(directRewards, 3)} / {numberFormat(indirectRewards, 3)}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex space-x-5 w-1/2">
                                                                        <div className="shadow-md bg-white dark:bg-gray-900 p-5 mb-5 w-1/2 rounded-2xl">
                                                                            <div className="font-bold text-sm opacity-80">Net Deposits</div>
                                                                            <div className="text-sky-500 dark:text-blue-300 font-semibold mt-3 break-all">{numberFormat(netDeposits, 14)}</div>
                                                                        </div>
                                                                        <div className="shadow-md bg-white dark:bg-gray-900 p-5 mb-5 w-1/2 rounded-2xl">
                                                                            <div className="font-bold text-sm opacity-80">Net Positive</div>
                                                                            <div className="text-sky-500 dark:text-blue-300 font-semibold mt-3 break-all">{isNetPositive ? 'Yes' : 'No'}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        }
                                                    />
                                                </React.Fragment>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>

                        </div>
                        <Donate />
                    </>
                )}
            </div>
        </PageContainer>
    );
}

export default Dashboard;
