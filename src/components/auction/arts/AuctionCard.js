import { useContractKit } from "@celo-tools/use-contractkit";
import { toast } from "react-toastify";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FloatingLabel } from "react-bootstrap";
import PropTypes from "prop-types";
import {
  Button,
  Card,
  Col,
  Form,
  Badge,
  Stack,
  Row,
  Modal,
  Offcanvas,
} from "react-bootstrap";
import Identicon from "../../ui/Identicon";
import Loader from "../../ui/Loader";
import { NotificationSuccess, NotificationError } from "../../ui/Notifications";
import { BidOnArtifact, AucStatus } from "../../../utils/artifact";
import { truncateAddress, CeloDecVal, formatBigNumber } from "../../../utils";

// #tag Use Up Every Available  Browser's Resources.

/** The AuctionCard Component */
const AuctionCard = ({ art, address, useCon }) => {
  const { image, description, owner, name, date, index, price, attributes } =
    art; /** The Artifacts Nft Construct */
  const { performActions } = useContractKit(); /*PerformActions : used to run smart contract interactions in order */
  const [bid, setBid] = useState(0); /**Bid: Sets A Bid On An Artifact */
  const [show, setShow] = useState(false); /** Sets The State Of The Form Modal Display */
  const [offshow, setOffShow] = useState(false); /** Sets The State Of The Offcanvas Display */
  const [countdown, setCountdown] = useState(""); /** CountDown: Sets The Current Count Down Timmer If It's Running */
  const [loading, setLoading] = useState(false);
  const [aucstart, setAucstart] = useState(""); /** AucStart: Sets The Auction's Starting Date And Time In A String */
  const [aucend, setAucend] = useState(""); /** AucEnd: Sets The Auction's Ending Date and Time In A String */
  const [msg, setMsg] = useState(""); /** Msg: Sets Any Available Message From The Auction */
  const [aucstarted, setAucStarted] = useState(false); /** AucStarted: Validate's Auction's On This Artifact Has Started */
  const [validbid, setValidBid] = useState(false); /** ValidBid: Validate's A Valid Bid */

  /* Validates A Form Is filled Before It's Submited */
  const isFormFilled = () => bid && validbid;

  // close the popup modal
  const handleClose = () => setShow(false);
  // display the popup modal
  const handleShow = () => setShow(true);

  // Close's The Offcanvas
  const offhandleClose = () => setOffShow(false);

  // Open's The Offcanvas
  const offhandleShow = () => setOffShow(true);

  var Aucended = useRef(false); /** AucEnded: Validate's Auction's On This Artifact Is Ended */
  var HighestBidder = useRef(null); /**HighestBidder: Set's The HighestBidders Address */
  var HighestBid = useRef(0); /**HighestBid: Set's The HighestBid Value */
  var OwnAuction = useRef(false); /** OwnAuction: Validate If User Own's The Auction */
  OwnAuction.current = address === owner;

  /** Called To Place A BId On An Aution */
  const bidOnauc = async (tokenId, bid) => {
    try {
      setLoading(true);
      var _now = new Date()
      var etime = new Date(Date.parse(date));
      var _Auctime = new Date(Date.parse(date));
      var _Aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
      if(_Auctime > _now || _now > _Aucend){
        toast(<NotificationSuccess text="Not Yet Aution Time Or Auction Time Passed...." />);
        return;

      }
      // Calling The Contract
      await BidOnArtifact(useCon, performActions, tokenId, bid);
      toast(<NotificationSuccess text="Placing Bid...." />);
      ChkAucStatus(tokenId);
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to Place Bid." />);
    } finally {
      setLoading(false);
    }
  };

  /** Called To Get Updated Info On An Auction */
  const ChkAucStatus = useCallback(
    async (tokenId) => {
      try {
        setLoading(true);
        // Calling The Contract And Other Validations
        const info = await AucStatus(useCon, tokenId);
        HighestBidder.current = info[1];
        HighestBid.current = formatBigNumber(info[0]);
        var _now = new Date();
        var etime = new Date(Date.parse(date));
        const _Aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
        if (_Aucend < _now) {
          Aucended.current = true;
          if (HighestBid.current > 0) {
            setMsg(
              "When Payment For This Artifact Is Approved Highest Bidder Will See this Item In The Collectables"
            );
          }
        }
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
      }
    },
    [useCon, date]
  );

  /** AuCtion Time & CountDown Fuction */
  const Auctimmer = useCallback(async () => {
    var etime = new Date(Date.parse(date));
    var dtime = new Date(Date.parse(date));
    const _Auctime = new Date(Date.parse(date));
    const _Aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
    var duration = new Date(dtime.setMinutes(dtime.getMinutes() + 6));
    var _now = new Date();
    /** This Only Executes when It's Auction Time And During The Auction */
    const _ifAuctime = async () => {
      setAucStarted(true);
      var timeHandle = setInterval(() => {
        var _now = new Date();
        var _timeleft = new Date(
          _now.setMinutes(duration.getMinutes() - _now.getMinutes())
        );
        var count = new Date(_timeleft.setSeconds(60 - _timeleft.getSeconds()));
        setCountdown(`${count.getMinutes()}:${count.getSeconds()}`);
      }, 2000);

      /**Times Out At Auction End */
      setTimeout(() => {
        Aucended.current = true;
        setAucStarted(false);
        clearInterval(timeHandle);
        setCountdown("00:00");
        ChkAucStatus(index.toString());
      }, parseInt(_Aucend - _now + 4000));
    };

    if (_Auctime < _now) {
      _ifAuctime();
      ChkAucStatus(index.toString());
    } else if (_Auctime > _now) {
      /**Times Out At Auction Start */
      setTimeout(() => {
        _ifAuctime();
      }, parseInt(_Auctime - _now));
    }
  }, [date, index, ChkAucStatus]);

  /** Executed At Initial Render Or By Trigered Changes */
  useEffect(() => {
    var auctime = new Date(Date.parse(date));
    setAucstart(auctime.toLocaleString());
    var etime = new Date(Date.parse(date));
    var aucend = new Date(etime.setMinutes(etime.getMinutes() + 6));
    setAucend(aucend.toLocaleString());
    var _now = new Date();
    if (aucend < _now) {
      Aucended.current = true;
      ChkAucStatus(index.toString());
    } else if (aucend > _now) {
      Auctimmer();
    }
  }, [date, index, ChkAucStatus, Auctimmer]);

  return (
    <Col key={index}>
      <Card
        className="border rounded h-100"
        bg={"info"}
        text={"info" === "light" ? "dark" : "white"}
        style={{ width: "18rem" }}
      >
        <Card.Header>
          <Stack direction="horizontal" gap={1}>
            <Identicon address={owner} size={28} />
            <span className="font-monospace text-dark">
              {truncateAddress(owner)}
            </span>
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
                      <div className="bg-info">
                        <div className="text-dark fw-lighter small text-capitalize">
                          {attribute.option.toUpperCase()}:
                          
                          {attribute.value.toUpperCase()}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
              <div className="bg-info">
                <span className="font-monospace text-dark">
                  Starting Price: {price} celo
                  <br />
                  <b></b>
                  Count Down: {countdown}
                  <br />
                  <b></b>
                  Highest Bid: {HighestBid.current} celo
                </span>
              </div>
              <Row className="mt-2">
                <Col>
                  <div className="border rounded bg-info">
                    <div className="text-dark fw-lighter small text-capitalize">
                      <Button
                        disabled={!aucstarted || Aucended.current}
                        variant="dark"
                        onClick={() => ChkAucStatus(index.toString())}
                      >
                        Query Bid
                      </Button>

                      <Button
                        onClick={() => {
                          ChkAucStatus(index.toString());
                          handleShow();
                        }}
                        disabled={
                          !aucstarted || Aucended.current || OwnAuction.current
                        }
                        variant="dark"
                        className="rounded-pill px-0"
                        style={{ width: "38px" }}
                      >
                        <i className="bi bi-plus"></i>
                      </Button>
                      <Button variant="dark" onClick={offhandleShow}>
                        MORE INFO
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              <Offcanvas
                show={offshow}
                onHide={offhandleClose}
                placement={"end"}
                className="border rounded bg-info"
              >
                <Offcanvas.Header closeButton>
                  <Offcanvas.Title>Artifact INFO</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                  <div className="bg-info">
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
                      <br />
                      <b></b>
                      Count Down: {countdown}
                    </span>
                  </div>
                  <div className="bg-info">
                    <span className="font-monospace text-dark">
                      Highest Bid: {HighestBid.current} celo
                      <br />
                      <b></b>
                      HighestBidder:{truncateAddress(HighestBidder.current)}
                      <br />
                      <b></b>
                      Update: {msg}
                    </span>
                  </div>
                </Offcanvas.Body>
              </Offcanvas>
              <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Bid On Auction</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="border rounded bg-light">
                    {validbid && (
                      <div className="text-secondary fw-lighter small text-capitalize">
                        Bid Is Valid ✅
                      </div>
                    )}
                    {!validbid && (
                      <div className="text-secondary fw-lighter small text-capitalize">
                        Invalid Bid Use Value Grater Than the Highest Bid.
                      </div>
                    )}
                  </div>
                  <Form>
                    <FloatingLabel
                      controlId="inputBid"
                      label="Place Bid"
                      className="mb-3"
                    >
                      <Form.Control
                        type="text"
                        placeholder="Place Bid"
                        onChange={(e) => {
                          setBid(String(CeloDecVal(Number(e.target.value))));
                          setValidBid(
                            Number(e.target.value) >= Number(price) &&
                              Number(e.target.value) >
                                Number(HighestBid.current)
                          );
                        }}
                      />
                    </FloatingLabel>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline-secondary" onClick={handleClose}>
                    Close
                  </Button>
                  <Button
                    disabled={!isFormFilled()}
                    variant="dark"
                    onClick={() => {
                      bidOnauc(index.toString(), bid);
                      handleClose();
                    }}
                  >
                    Place Bid...
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </>
        ) : (
          <Loader />
        )}
      </Card>
    </Col>
  );
};

AuctionCard.propTypes = {
  // props passed into this component
  art: PropTypes.instanceOf(Object).isRequired,
  useCon: PropTypes.instanceOf(Object).isRequired,
  address: PropTypes.string.isRequired,
};

export default AuctionCard;
