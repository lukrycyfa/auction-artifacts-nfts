/* eslint-disable react/jsx-filename-extension */
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";
import { uploadArtifactFile } from "../../../utils/artifact";

/* Attributes That Can Be Added To An Artifacts Nft */
const ARTIFACT_VALUE = ["Common", "Rear", "Very_Rear"];
const ARTIFACT_TYPE = [
  "Sculpture",
  "Jewelry",
  "Potriat",
  "Casting",
  "Carving",
  "Others",
];


/** The AddArtifacts Component */
const UpdateArtifact = ({ save, art }) => {
  const { index, image, description, owner, name, date, price, attributes } =
    art; /** Previous Art Construct */

  const [newartname, setNewArtName] = useState(name); /* newArtname: Artifact's Nft newName */
  const [newipfsArtAlias, setNewIpfsArtAlias] = useState(image); /* newIpfsArtAlias: Artifact's Nft newipfsalias */
  const [newdescription, setNewDescription] = useState(description); /* newDescription: Artifact's Nft newdescription */
  const [newauctiondate, setNewAuctiondate] = useState(date); /* newAuctiondate: Artifact's Nft newAuctiondate */
  const [newfirstprice, setNewFirstprice] = useState(price); /* newFirstprice: Artifact's Nft newfirstprice */
  const [valid, setValid] = useState(false); /* Vaiddate: Artifact's Nft valid date State*/
  const [newattr, setNewAttributes] = useState(attributes); /* Attributes: An Array Of Attributes For An Artifact's Nft */
  const [show, setShow] = useState(false); /** Sets The State Of The Form Modal Display */
  const _typ = "type";
  const _arv = "art_value";

  /* Define A Valiid Auction Time */
  var _valid = new Date();
  _valid = new Date(_valid.setHours(_valid.getHours() + 1));

  //* Validates A filled Form Before It Is Submited */
  const isFormFilled = useCallback(() => {
    return (
      newartname &&
      valid &&
      newauctiondate &&
      newfirstprice > 0 &&
      newipfsArtAlias &&
      newdescription &&
      newattr.length > 1
    );
  }, [
    newartname,
    valid,
    newauctiondate,
    newfirstprice,
    newipfsArtAlias,
    newdescription,
    newattr,
  ]);

  // close the popup modal
  const handleClose = () => {
    setShow(false);
    setNewAttributes([]);
  };

  // display the popup modal
  const handleShow = () => setShow(true);

   /*Add An Attribute To The Artifact's Nft */
  const setAttributesFunc = (e, option) => {
    const { value } = e.target;
    const attributeObject = {
      option,
      value,
    };
    const arr = newattr;

    // check if attribute already exists
    const index = arr.findIndex((el) => el.option === option);

    if (index >= 0) {
      // update the existing attribute
      arr[index] = {
        option,
        value,
      };
      setNewAttributes(arr);
      return;
    }

    // add a new attribute
    setNewAttributes((oldArray) => [...oldArray, attributeObject]);
  };

  return (
    <>
      <Button
        onClick={handleShow}
        variant="danger"
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i className="bi bi-plus"></i>
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Artifact</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="border rounded bg-light">
            {valid && (
              <div className="text-secondary fw-lighter small text-capitalize">
                Auction Date Is Valid ✅
              </div>
            )}
            {!valid && (
              <div className="text-secondary fw-lighter small text-capitalize">
                Auction Date Is inValid Use a Date Or Time Ahead of Now.
              </div>
            )}
          </div>
          <Form>
            <FloatingLabel
              controlId="inputArtName"
              label="Name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                value={newartname}
                placeholder="Name of Artifact"
                onChange={(e) => {
                  setNewArtName(e.target.value);
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputDescription"
              label="Description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                value={newdescription}
                placeholder="description"
                style={{ height: "80px" }}
                onChange={(e) => {
                  setNewDescription(e.target.value);
                }}
              />
            </FloatingLabel>

            <Form.Control
              type="file"
              className={"mb-3"}
              onChange={async (e) => {
                const imageUrl = await uploadArtifactFile(e);
                if (!imageUrl) {
                  alert("failed to upload image");
                  return;
                }
                setNewIpfsArtAlias(imageUrl);
              }}
              placeholder="Artifact Image"
            />
            <Form.Label>
              <h5>Atributes</h5>
            </Form.Label>
            <Form.Control
              as="select"
              className={"mb-3"}
              onChange={async (e) => {
                setAttributesFunc(e, "art_value");
              }}
              placeholder="Artifact Value"
            >
              <option hidden>Artifact Value</option>
              {ARTIFACT_VALUE.map((art_value) => (
                <option
                  key={`artifact_value-${art_value.toLowerCase()}`}
                  value={art_value.toLowerCase()}
                >
                  {art_value}
                </option>
              ))}
            </Form.Control>

            <Form.Control
              as="select"
              className={"mb-3"}
              onChange={async (e) => {
                setAttributesFunc(e, "type");
              }}
              placeholder="Artifact Type"
            >
              <option hidden>Artifact Type</option>
              {ARTIFACT_TYPE.map((type) => (
                <option
                  key={`artifact_type-${type.toLowerCase()}`}
                  value={type.toLowerCase()}
                >
                  {type}
                </option>
              ))}
            </Form.Control>

            <FloatingLabel
              controlId="inputAuctionDate&Time"
              label="Auction Date & Time"
              className="mb-3"
            >
              <Form.Control
                type="datetime-local"
                value={newauctiondate}
                placeholder="Auction Date & Time"
                style={{ height: "80px" }}
                onChange={(e) => {
                  setNewAuctiondate(e.target.value);
                  setValid(new Date(Date.parse(e.target.value)) > _valid);
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputfirstprice"
              label="Price"
              value={newfirstprice}
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Price of Artifact"
                onChange={(e) => {
                  setNewFirstprice(Number(e.target.value));
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
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              save({
                index,
                newartname,
                newipfsArtAlias,
                newauctiondate,
                newdescription,
                newfirstprice,
                ownerAddress: owner,
                newattr,
              });
              handleClose();
            }}
          >
            Update ART
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

UpdateArtifact.propTypes = {
  // props passed into this component
  art: PropTypes.instanceOf(Object).isRequired,
  save: PropTypes.func.isRequired,
};

export default UpdateArtifact;
