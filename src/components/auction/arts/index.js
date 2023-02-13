import { useContractKit } from "@celo-tools/use-contractkit";
import { useAuctionContract } from "../../../hooks";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import AddArtifacts from "./AddArt";
import AuctionCard from "./AuctionCard";
import CollectCard from "./CollectCard";
import OwnCard from "./OwnCard";
import SetPrice from "./SetPrice";
import Loader from "../../ui/Loader";
import { NotificationSuccess, NotificationError } from "../../ui/Notifications";
import {
  getArtifactsOnAuc,
  createArt,
  getOwnArtifacts,
  getOwnCollectables,
  fetchAuctionContractOwner,
  UpdateMintPrice,
  GetMintPrice,
  WithdrawBal,
} from "../../../utils/artifact";
import { truncateAddress, formatBigNumber } from "../../../utils";
import { Row, Placeholder, Card, Stack, Button } from "react-bootstrap";

const Artifacts = ({ auctionContract, name }) => {
  /* performActions : used to run smart contract interactions in order
   *  address : fetch the address of the connected wallet
   */
  const { performActions, address } = useContractKit();
  const useCon = useAuctionContract(); /*useCon : used to Interact with The Deployed Smart Contracts Functionalities */
  const [auctions, setAuctions] = useState([]); /* Auctions : An Array Of Artifacts Nft's On Auctions */
  const [myartifacts, setMyArtifacts] = useState([]); /* Myartifacts : An Array Of Owned Artifacts Nft's */
  const [mycollects, setMyCollects] = useState([]); /* Mycollects : An Array Of Collectable Artifacts Nft's */
  const [loading, setLoading] = useState(false);
  const [aucOwner, setAucOwner] = useState(null); /* AucOwner : The Address Of The Auction Owner */
  const [_mintPrice, set_Mintprice] = useState(0); /* _mintPrice : The Cost For Minting On This Dapp */

  /** Fetch All Artifact's Nft On Auctions */
  const getAuctions = useCallback(async (auctionContract) => {
    try {
      setLoading(true);

      // Fetch All Artifact's Nft On Auctions From The Smart Contract
      const allAuctions = await getArtifactsOnAuc(auctionContract);
      if (!allAuctions) return;
      setAuctions(allAuctions);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch All Owned Artifact's Nft */
  const getMyArtifacts = useCallback(async (auctionContract) => {
    try {
      setLoading(true);
      // Fetch All Owned Artifact's Nft From The Smart Contract
      const ownArtifact = await getOwnArtifacts(auctionContract);
      if (!ownArtifact) return;
      setMyArtifacts(ownArtifact);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch All Owned Collectable Artifact's Nft */
  const getMyCollects = useCallback(
    async (auctionContract) => {
      try {
        setLoading(true);
        // Fetch All Owned Collectable Artifact's Nft From The Smart Contract
        const ownCollects = await getOwnCollectables(auctionContract, address);
        if (!ownCollects) return;
        setMyCollects(ownCollects);
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  /* Create A New Artifact Nft */
  const addArtifact = async (data) => {
    try {
      setLoading(true);

      /* Create A New Artifact Nft Making A Call To The Contract*/
      await createArt(auctionContract, performActions, data);
      toast(<NotificationSuccess text="Updating Artifact's list...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to Update Artifact's List" />);
    } finally {
      setLoading(false);
    }
  };

  /**Called To Set The Minting Price On the Dapp */
  const setMintprice = async (_mintprice) => {
    try {
      setLoading(true);

      /** Making A Call to The Contract */
      await UpdateMintPrice(auctionContract, performActions, _mintprice);
      toast(<NotificationSuccess text="Updating Minting Price...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to Update Mint Price." />);
    } finally {
      setLoading(false);
    }
  };

  /**Called To Withdraw The Available Balance From The Contract */
  const withDrawBalance = async () => {
    try {
      setLoading(true);

      /** Making A Call to The Contract */
      await WithdrawBal(auctionContract);
      toast(<NotificationSuccess text="Withdrawing Balance...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to Withdraw Balance." />);
    } finally {
      setLoading(false);
    }
  };

  /** Fetch The Contract's Owners Address */
  const fetchContractOwner = useCallback(async (auctionContract) => {
    // Making A Call To The Contract
    const _address = await fetchAuctionContractOwner(auctionContract);
    setAucOwner(_address);
  }, []);

  /** Fetch The Price For Minting An Artifact's Nft */
  const fetchMintingPrice = useCallback(async (auctionContract) => {
    // Making A Call To The Contract
    const _mintprice = await GetMintPrice(auctionContract);
    set_Mintprice(formatBigNumber(_mintprice));
  }, []);

  useEffect(() => {
    try {
      if (address && auctionContract) {
        getAuctions(auctionContract);
        getMyArtifacts(auctionContract);
        getMyCollects(auctionContract);
        fetchContractOwner(auctionContract);
        fetchMintingPrice(auctionContract);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }
    } catch (error) {
      console.log({ error });
    }
  }, [
    auctionContract,
    address,
    getMyArtifacts,
    getMyCollects,
    getAuctions,
    fetchContractOwner,
    fetchMintingPrice,
  ]);
  if (address) {
    return (
      <>
        {!loading ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-4 fw-bold mb-0 font-monospace text-light">
                <Placeholder
                  className="border rounded w-100"
                  xs={17}
                  bg="light"
                />
                🎟 {name.toUpperCase()}
                <br />
                <b></b>
                Owner:{truncateAddress(aucOwner)}
                <br />
                <b></b>
                Minting Price:{_mintPrice} CELO
                <Placeholder
                  className="border rounded w-100"
                  xs={17}
                  bg="success"
                />
              </h1>
            </div>
            <br />
            <b></b>
            <Card style={{ backgroundColor: "#2f0145" }}>
              <Card.Header>
                <h1 className="fs-5 fw-bold mb-0 font-monospace text-light">
                  ARTIFACTS ON AUCTIONS
                </h1>
              </Card.Header>
              <Card.Body>
                <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-l-4 g-xl-5">
                  {/* display all Auction Artifacts */}
                  {auctions.map((_aucart) => (
                    <AuctionCard
                      key={_aucart.index}
                      art={_aucart}
                      address={address}
                      useCon={useCon}
                    />
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        ) : (
          <Loader />
        )}
        {!loading && address === aucOwner && (
          <>
            <br />
            <b></b>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-5 fw-bold mb-0 font-monospace text-light">
                <Placeholder
                  className="border rounded w-100"
                  xs={17}
                  bg="danger"
                />
                SET MINTING PRICE <SetPrice save={setMintprice} />" "
                <Button
                  disabled={address !== aucOwner}
                  variant="success"
                  onClick={() => {
                    withDrawBalance();
                  }}
                >
                  Withdraw Balance
                </Button>
                <Placeholder
                  className="border rounded w-100"
                  xs={17}
                  bg="light"
                />
              </h1>
            </div>
          </>
        )}
        {!loading && (
          <>
            <br />
            <b></b>
            <Card style={{ backgroundColor: "#2f0145" }}>
              <Card.Header>
                <Stack direction="horizontal" gap={5}>
                  <h1 className="fs-5 fw-bold mb-0 font-monospace text-light">
                    MY ARTIFACTS
                  </h1>

                  <h1 className="fs-5 fw-bold mb-0 font-monospace text-light">
                    Mint Artifact...
                    <AddArtifacts save={addArtifact} address={address} />
                  </h1>
                </Stack>
              </Card.Header>
              <Card.Body>
                <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xl-5">
                  {/* display all my artifacts */}
                  {myartifacts.map((_myart) => (
                    <OwnCard key={_myart.index} 
                     art={_myart}
                     useCon={useCon} 
                    />
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
        {!loading && (
          <>
            <br />
            <b></b>
            <Card style={{ backgroundColor: "#2f0145" }}>
              <Card.Header>
                <h1 className="fs-5 fw-bold mb-0 font-monospace text-light">
                  MY COLLECTABLES
                </h1>
              </Card.Header>
              <Card.Body>
                <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xl-5">
                  {/* display all my collectables */}
                  {mycollects.map((_mycol) => (
                    <CollectCard
                      key={_mycol.index}
                      art={_mycol}
                      address={address}
                      useCon={useCon}
                    />
                  ))}
                </Row>
              </Card.Body>
            </Card>
            <br />
            <b></b>
            <br />
            <b></b>
          </>
        )}
      </>
    );
  }
  return null;
};

Artifacts.propTypes = {
  // props passed into this component
  auctionContract: PropTypes.instanceOf(Object),
  updateBalance: PropTypes.func.isRequired,
};

export default Artifacts;
