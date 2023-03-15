import { useContractKit } from "@celo-tools/use-contractkit";
import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import {
  Button,
  Card,
  Col,
  Badge,
  Stack,
  Row,
  Offcanvas,
} from "react-bootstrap";
import { truncateAddress, formatBigNumber } from "../../../utils";
import Identicon from "../../ui/Identicon";
import Loader from "../../ui/Loader";
import UpdateArtifact from "./UpdateCard";
import { NotificationSuccess, NotificationError } from "../../ui/Notifications";
import {
  AddArtifactToAuc,
  AucStatus,
  ReactivateDeadAuction,
  ActAucs,
  EndAuction,
  EndedAucsList,
  updateArt,
} from "../../../utils/artifact";

/** The OwnCard Component */
const OwnCard = ({ art, useCon }) => {
  const { image, description, owner, name, date, index, price, attributes } =
    art; /** The Artifacts Nft Construct */

  const { performActions } = useContractKit(); /*PerformActions : used to run smart contract interactions in order */
  const [running, setRunning] = useState(false); /** Running: Validate's Auction's On This Artifact Is Running */
  const [aucended, setAucended] = useState(false); /** AucEnded: Validate's  Auction's On This Artifact Is Ended */
  const [loading, setLoading] = useState(false);
  const [torestore, setTorestore] = useState(false); /** ToRestore: Validate The ToRestore State Of A Dead Auction i.e bid==0 After Auctions */
  const [aucstart, setAucStart] = useState(""); /** AucStart: Sets The Auction's Starting Date And Time In A String */
  const [aucend, setAucEnd] = useState(""); /** AucEnd: Sets The Auction's Ending Date and Time In A String */
  const [tokenonauc, setTokenonAuc] = useState(false); /** TokenOnAuc: Validate The TokenOnAuc State Of An Artifact's Token */
  const [collected, setCollected] = useState(false); /** TokenOnAuc: Validate The Collected State Of An Artifact If Auctioned */

  var HighestBid = useRef(0); /**HighestBid: Set's The HighestBid Value */
  var HighestBidder = useRef(""); /**HighestBidder: Set's The HighestBidders Address */
  const [show, setShow] = useState(false); /** Sets The State Of The Offcanvas Display */
  //Open's The Offcanva's modal
  const handleClose = () => setShow(false);

  //Close's The Offcanva's modal
  const handleShow = () => setShow(true);

  /** Called To Get Updated Info On An Auction */
  const ChkAucStatus = useCallback(
    async (tokenId) => {
      try {
        setLoading(true);
        // Calling The Contract And Other Validations
        const auclst = await ActAucs(useCon);
        var idx = auclst.find((el) => el === tokenId);
        if (idx === undefined) return;
        const info = await AucStatus(useCon, tokenId);
        HighestBid.current = formatBigNumber(info[0]);
        HighestBidder.current = info[1];
        if (HighestBid.current <= 0) {
          setTorestore(true);
        }
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
      }
    },
    [useCon]
  );

  /** Called To Validate If This Artifacts Nft Is Part Of The Auctions */
  const TokenInAuc = useCallback(
    async (tokenId) => {
      try {
        setLoading(true);
        // Calling The Contract And Other Validations
        const auclst = await ActAucs(useCon);
        var idx = auclst.findIndex((el) => el === tokenId);
        if (idx < 0) return;
        setTokenonAuc(true);
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
      }
    },
    [useCon]
  );

  /** Called To Validate If This Artifacts Nft Is Part Of The Ended Auctions */
  const TokenOffAuc = useCallback(
    async (tokenId) => {
      try {
        setLoading(true);
        // Calling The Contract And Other Validations
        const auclst = await EndedAucsList(useCon);
        var idx = auclst.findIndex((el) => el === tokenId);
        if (idx < 0) return;
        const info = await AucStatus(useCon, tokenId);
        HighestBid.current = formatBigNumber(info[0]);
        HighestBidder.current = info[1];
        setCollected(owner === info[1]);
        if (HighestBid.current <= 0) {
          setTorestore(true);
        }
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
      }
    },
    [useCon, owner]
  );

  /** Called To Add This Artifacts Nft To Auctions */
  const addToauc = async (tokenId) => {
    try {
      setLoading(true);
      // Calling The Contract And Other Validations
      const _Auctime = new Date(Date.parse(date));
      const _tim = (_Auctime.getTime() / 1000).toFixed();
      var _spare = new Date();
      _spare = new Date(_spare.setMinutes(_spare.getMinutes() + 15));
      if (_Auctime < _spare) {
        toast(
          <NotificationSuccess text="Auction Time Passed Update Artifact Date...." />
        );
        return;
      }
      await AddArtifactToAuc(useCon, performActions, tokenId, _tim);
      toast(<NotificationSuccess text="Adding Artifact To Auction...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed To Add Artifact To Auction." />);
    } finally {
      setLoading(false);
    }
  };

  /** Called To Restore This Artifacts Nft To Auctions If It Ended Without A Bid
   * Requires An Updated Artifact To Be Restored
   */
  const RestoreAuc = async (tokenId) => {
    try {
      setLoading(true);
      // Calling The Contract And Other Validations
      const auclst = await ActAucs(useCon);
      var idx = auclst.find((el) => el === tokenId);
      if (idx !== undefined) {
        toast(<NotificationSuccess text="Pls End Aution First...." />);
        return;
      }
      var _Atime = new Date(Date.parse(date));
      const _tim = (_Atime.getTime() / 1000).toFixed();
      var _spare = new Date();
      _spare = new Date(_spare.setMinutes(_spare.getMinutes() + 15));
      if (_spare > _Atime) {
        toast(<NotificationSuccess text="Pls Update To A valid Date...." />);
        return;
      }

      await ReactivateDeadAuction(useCon, performActions, tokenId, _tim);
      toast(<NotificationSuccess text="Restoring Dead Auction...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed To Restore Dead Auction." />);
    } finally {
      setLoading(false);
    }
  };

  /** Called To End This Artifacts Auctions */
  const EndAuc = async (tokenId) => {
    try {
      setLoading(true);
      // Calling The Contract And Other Validations
      var etime = new Date(Date.parse(date));
      var aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
      var _now = new Date();
      if (aucend > _now) {
        toast(
          <NotificationSuccess text="Pls Wait Until Auction Time IS Passed...." />
        );
        return;
      }
      await EndAuction(performActions, useCon, tokenId);
      toast(<NotificationSuccess text="Ending Auction...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed To End Auction." />);
    } finally {
      setLoading(false);
    }
  };

  /** Called To Update This Artifacts Nft's Properties */
  const UpdateArt = async (data) => {
    try {
      setLoading(true);
      // Calling The Contract And Other Validations
      const auclst = await ActAucs(useCon);
      var idx = auclst.findIndex((el) => el === data.index.toString());
      var etime = new Date(Date.parse(date));
      var _auctime = new Date(etime.setMinutes(etime.getMinutes() - 8));
      var _now = new Date();
      if (_auctime < _now && idx >= 0) {
        toast(
          <NotificationSuccess text="Can't Update An Artifact While Close To Aution Time Or Still An Active Auction..." />
        );
        return;
      }
      await updateArt(useCon, performActions, data);
      toast(<NotificationSuccess text="Updating  My Artifact...." />);
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to Update  My Artifact." />);
    } finally {
      setLoading(false);
    }
  };

  /** AuCtion Time & CountDown Fuction */
  const Auctimmer = useCallback(async () => {
    const _Auctime = new Date(Date.parse(date));
    var etime = new Date(Date.parse(date));
    const _Aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
    /** This Only Executes when It's Auction Time And During The Auction */
    const _chkcall = () => {
      var _now = new Date();
      setTimeout(() => {
        setRunning(false);
        setAucended(true);
        ChkAucStatus(index.toString());
      }, parseInt(_Aucend - _now + 5000));
    };

    var _now = new Date();
    if (_Auctime < _now) {
      _chkcall();
      setRunning(true);
    } else if (_Auctime > _now) {
      /**Times Out At Auction Start */
      setTimeout(() => {
        setRunning(true);
        _chkcall();
      }, parseInt(_Auctime - _now + 5000));
    }
  }, [date, index, ChkAucStatus]);

  /** Executed At Initial Render Or By Trigered Changes */
  useEffect(() => {
    var auctime = new Date(Date.parse(date));
    setAucStart(auctime.toLocaleString());
    var etime = new Date(Date.parse(date));
    var aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
    setAucEnd(aucend.toLocaleString());
    var _now = new Date();
    if (aucend < _now) {
      setAucended(true);
      setTimeout(() => {
        ChkAucStatus(index.toString());
      }, 2000);
      setTimeout(() => {
        TokenOffAuc(index.toString());
      }, 5000);
    } else if (aucend > _now) {
      Auctimmer();
    }
    setTimeout(() => {
      TokenInAuc(index.toString());
    }, 2000);
    setTimeout(() => {
      TokenOffAuc(index.toString());
    }, 4000);
  }, [date, index, ChkAucStatus, Auctimmer, TokenInAuc, TokenOffAuc]);
  
  return (
    <Col key={index}>
      <Card
        className="border rounded  h-100"
        bg={"primary"}
        text={"primary" === "light" ? "dark" : "white"}
        style={{ width: "18rem" }}
      >
        <Card.Header>
          <Stack direction="horizontal" gap={1}>
            <Identicon address={owner} size={22} />
            {!collected && (
              <span className="font-monospace text-dark">
                {truncateAddress(owner)}
              </span>
            )}               
            {collected && (
              <span className="font-monospace text-dark">
                {truncateAddress(HighestBidder.current)}
              </span>
            )}    
            {!running && HighestBid.current <= 0 && (
              <UpdateArtifact art={art} save={UpdateArt} />
            )}
            <Badge bg="secondary" className="ms-auto">
              {index} ID
            </Badge>
            {!loading ? (
              <>
                <span className="font-monospace text-dark">
                  {HighestBid.current} celo
                </span>
              </>
            ) : (
              <Loader />
            )}
          </Stack>
        </Card.Header>

        <div className=" ratio ratio-4x3">
          <img src={image} alt={description} style={{ objectFit: "cover" }} />
        </div>
        {!loading ? (
          <>
            <Card.Body className="d-flex  flex-column text-center">
              <Card.Title>{name}</Card.Title>
              <div>
                <Row className="mt-1">
                  {attributes.map((attribute, key) => (
                    <Col key={key}>
                      <div className="bg-primary">
                        <div className="text-dark fw-lighter medium text-capitalize">
                          {attribute.option}
                        </div>
                      </div>
                      <div className="bg-primary">
                        <div className="text-dark fw-lighter medium text-capitalize">
                          {attribute.value}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
              <div className="bg-primary">
                <span className="font-monospace text-dark">
                  Highest Bid: {HighestBid.current} celo
                </span>
              </div>
              <Button variant="dark" onClick={handleShow}>
                MORE INFO
              </Button>
              <Offcanvas
                show={show}
                onHide={handleClose}
                placement={"end"}
                className="border rounded bg-primary"
              >
                <Offcanvas.Header closeButton>
                  <Offcanvas.Title>Artifact INFO</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                  <div className="bg-primary">
                    <span className="font-monospace text-dark">
                      {description}
                      <br />
                      <b></b>
                      Starts.{aucstart}
                      <br />
                      <b></b>
                      Ends.{aucend}
                      <br />
                      <b></b>
                      Starting Price: {price} celo
                    </span>
                  </div>
                  <div className="bg-primary">
                    <span className="font-monospace text-dark">
                      Highest Bid: {HighestBid.current} celo
                      <br />
                      <b></b>
                      HighestBidder:{truncateAddress(HighestBidder.current)}
                    </span>
                  </div>
                  <div className="bg-primary">
                    {!loading && running && !aucended && (
                      <div className="text-dark fw-lighter small text-capitalize">
                        Auctions Running
                      </div>
                    )}
                    {!loading && !running && aucended && (
                      <div className="text-dark fw-lighter small text-capitalize">
                        Auctions Ended
                      </div>
                    )}
                    {!loading && !running && !aucended && (
                      <div className="text-dark fw-lighter small text-capitalize">
                        Not Started
                      </div>
                    )}
                  </div>
                  <Button
                    disabled={tokenonauc || aucended || torestore}
                    variant="dark"
                    onClick={() => {
                      addToauc(index.toString());
                      handleClose();
                    }}
                  >
                    Add To Auctions
                  </Button>
                  {!loading && torestore && !collected && (
                    <div className="bg-primary">
                      <div className="text-dark fw-lighter small text-capitalize">
                        This Auction Had No Bid And Has Ended Pls Update
                        Before You Restore.
                      </div>

                      <Button
                        variant="dark"
                        disabled={!torestore}
                        onClick={() => {
                          RestoreAuc(index.toString());
                          handleClose();
                        }}
                      >
                        Restore Auction
                      </Button>
                    </div>
                  )}
                  {!loading &&
                    !torestore &&
                    !tokenonauc &&
                    aucended &&
                    !collected && (
                      <div className="bg-primary">
                        <div className="text-dark fw-lighter small text-capitalize">
                          Waiting To Be collected.
                        </div>
                      </div>
                    )}
                  {!loading && !tokenonauc && aucended && collected && (
                    <div className="bg-primary">
                      <div className="text-dark fw-lighter small text-capitalize">
                        Artifact collected.
                        <br />
                        <b></b>
                        Auctioned At: {HighestBid.current} celo
                      </div>
                    </div>
                  )}
                  {!loading &&
                    !running &&
                    aucended &&
                    !collected &&
                    tokenonauc && (
                      <div className="bg-primary">
                        <div className="text-dark fw-lighter small text-capitalize">
                          Pls Close This Auction For The HighestBidder To Collect The Artifact.
                        </div>
                        <Button
                          variant="dark"
                          disabled={!aucended || !tokenonauc}
                          onClick={() => {
                            EndAuc(index.toString());
                            handleClose();
                          }}
                        >
                          End Auction
                        </Button>
                      </div>
                    )}
                </Offcanvas.Body>
              </Offcanvas>
            </Card.Body>
          </>
        ) : (
          <Loader />
        )}
      </Card>
    </Col>
  );
};

OwnCard.propTypes = {
  // props passed into this component
  art: PropTypes.instanceOf(Object).isRequired,
  useCon: PropTypes.instanceOf(Object).isRequired
};

OwnCard.defaultProps = {
  auctionContract: null,
};

export default OwnCard;
