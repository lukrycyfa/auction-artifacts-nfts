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
  Accordion,
} from "react-bootstrap";
import Identicon from "../../ui/Identicon";
import Loader from "../../ui/Loader";
import { NotificationSuccess, NotificationError } from "../../ui/Notifications";
import {
  transToAucWinner,
  confirmAucwinner,
  AucStatus,
  PayForArtifact,
} from "../../../utils/artifact";
import { CeloDecVal, formatBigNumber, truncateAddress } from "../../../utils";

/** The CollectCard Component */
const CollectCard = ({ art, address, useCon }) => {
  const { image, description, owner, name, date, index, price, attributes } =
    art; /** The Artifacts Nft Construct */

  const { performActions } =
    useContractKit(); /*PerformActions : used to run smart contract interactions in order */
  const [bid, setBid] = useState(0); /**Bid: Sets The Payment To The Artifact */
  const [show, setShow] = useState(false); /** Sets The State Of The Form Modal Display */
  const [loading, setLoading] = useState(false);
  const [collectbutton, setCollectbutton] = useState(false); /** Sets The State Of The Collect Button */
  const [validpay, setValidPay] = useState(false); /** Validpay: Validate's The Collectable's Payment */

  /* Validates A Form Is filled Before It's Submited */
  const isFormFilled = () => bid && validpay;
  // close the popup modal
  const handleClose = () => setShow(false);

  // display the popup modal
  const handleShow = () => setShow(true);

  var HighestBidder = useRef(null); /**HighestBidder: Set's The HighestBidders Address */
  var HighestBid = useRef(null); /**HighestBid: Set's The HighestBid Value */

  /** Called By The HighestBidder To Transfer The Artifacts Nft When It's An Available Collectable */
  const TransFromAuc = async (TokenOwner, tokenId, bid) => {
    try {
      setLoading(true);

      // Calling The Contract And Other Validations
      await transToAucWinner(
        useCon,
        performActions,
        TokenOwner,
        tokenId,
        bid
      );
      toast(
        <NotificationSuccess text="Transfering Artifact To Highest Bidder...." />
      );
      window.location.reload();
    } catch (error) {
      console.log({ error });
      toast(
        <NotificationError text="Failed To Transfer Artifact To Highest Bidder.." />
      );
    } finally {
      setLoading(false);
    }
  };

  /** Called To Confirm The Highest Bidder To This Auctions */
  const ConfirmWinner = useCallback(
    async (tokenId) => {
      try {
        setLoading(true);

        // Calling The Contract And Other Validations
        const info = await AucStatus(useCon, tokenId);
        HighestBid.current = formatBigNumber(Number(info[0]));
        HighestBidder.current = info[1];
        const confirm = await confirmAucwinner(useCon, tokenId);
        var _comfirmpay = false;
        if (confirm === address) {
          _comfirmpay = await PayForArtifact(useCon, tokenId);
          if (_comfirmpay) {
            setCollectbutton(true);
          }
        }
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
      }
    },
    [useCon, address]
  );

  /** Executed At Initial Render Or By Trigered Changes */
  useEffect(() => {
    ConfirmWinner(index.toString());
  }, [date, index, ConfirmWinner]);

  return (
    <Col key={index}>
      <Card
        className=" h-100"
        bg={"success"}
        text={"success" === "dark" ? "dark" : "dark"}
        style={{ width: "18rem" }}
      >
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Identicon address={owner} size={28} />
            <span className="font-monospace text-dark">
              {truncateAddress(owner)}
            </span>
            <Badge bg="dark" className="ms-auto">
              {index} ID
            </Badge>
            {!loading ? (
              <>
                <span className="font-monospace text-dark">
                  Highest Bid: {HighestBid.current} celo
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

        <Card.Body className="d-flex  flex-column text-center">
          <Card.Title>{name}</Card.Title>
          {!loading && collectbutton ? (
            <Card.Title>Ready To Be Collected</Card.Title>
          ) : (
            <Loader />
          )}
          <Accordion style={{ backgroundColor: "#039156" }}>
            <Accordion.Item eventKey="0" style={{ backgroundColor: "#039156" }}>
              <Accordion.Header style={{ backgroundColor: "#039156" }}>
                More Info
              </Accordion.Header>
              <Accordion.Body style={{ backgroundColor: "#039156" }}>
                <div>
                  <Row className="mt-2">
                    {attributes.map((attribute, key) => (
                      <Col key={key}>
                        <div
                          className="rounded bg-success"
                          style={{ backgroundColor: "#039156" }}
                        >
                          <div
                            className="text-dark fw-lighter small text-capitalize"
                            style={{ backgroundColor: "#039156" }}
                          >
                            {attribute.option}
                          </div>
                          <div
                            className="text-dark text-capitalize font-monospace"
                            style={{ backgroundColor: "#039156" }}
                          >
                            {attribute.value}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
                <div
                  className="rounded bg-success"
                  style={{ backgroundColor: "#039156" }}
                >
                  {!loading ? (
                    <>
                      <span
                        className="font-monospace text-dark"
                        style={{ backgroundColor: "#039156" }}
                      >
                        {description}
                        <br />
                        <b></b>
                        Starting Price: {price} celo
                        <br />
                        <b></b>
                        Highest Bid: {HighestBid.current} celo
                      </span>
                    </>
                  ) : (
                    <Loader />
                  )}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>

        <Modal show={show} onHide={handleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <span className="font-monospace text-secondary">
                Enter HighestBid value
              </span>
              <br />
              <b></b>
              {validpay && (
                <span className="font-monospace text-secondary">
                  Payment Is Valid ✅
                </span>
              )}
              {!validpay && (
                <span className="font-monospace text-secondary">
                  Pls Input A Valid Payment.
                </span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <FloatingLabel
                controlId="inputBid"
                label="Enter HighestBid"
                className="mb-3"
              >
                <Form.Control
                  type="text"
                  placeholder="Enter HighestBid"
                  onChange={(e) => {
                    setBid(String(CeloDecVal(Number(e.target.value))));
                    setValidPay(
                      Number(e.target.value) ===
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
                TransFromAuc(owner, index.toString(), bid);
                handleClose();
              }}
            >
              Collect Art...
            </Button>
          </Modal.Footer>
        </Modal>
        <Row className="mt-2">
          <Col>
            <div className="border rounded bg-success">
              <div className="text-dark fw-lighter small text-capitalize">
                <Button
                  variant="dark"
                  onClick={() => ConfirmWinner(index.toString())}
                >
                  Confirm To Collect
                </Button>
                {!loading && collectbutton ? (
                  <Button
                    onClick={handleShow}
                    variant="dark"
                    className="rounded-pill px-0"
                    style={{ width: "38px" }}
                  >
                    <i className="bi bi-plus"></i>
                  </Button>
                ) : (
                  <Loader />
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </Col>
  );
};

CollectCard.propTypes = {
  // props passed into this component
  art: PropTypes.instanceOf(Object).isRequired,
  useCon: PropTypes.instanceOf(Object).isRequired,
  address: PropTypes.string.isRequired,
};

export default CollectCard;
