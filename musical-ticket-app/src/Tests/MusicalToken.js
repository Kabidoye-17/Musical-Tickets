const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MusicalToken", function () {
  let MusicalToken, musicalToken;
  let venue, doorman, user;

  beforeEach(async function () {
    [venue, doorman, user, other, other2] = await ethers.getSigners();

    const initialSupply = 500;
    const name = "MusicalToken";
    const symbol = "MTX";
    const decimals = 18;

    MusicalToken = await ethers.getContractFactory("MusicalToken");
    musicalToken = await MusicalToken.deploy(name, symbol, decimals, initialSupply, venue.address, doorman.address);
    await musicalToken.waitForDeployment();
  });

  describe("Deployment", function() {
    it("should assign initial supply to venue", async function () {
      const balance = await musicalToken.balanceOf(venue.address);
      expect(balance).to.equal(ethers.parseUnits("500", 18));
    });
  });

  
  describe("getTotalTokensSold", function () {
    it("returns correct number of sold tokens", async function () {
      const ticketPrice = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(3, { value: ticketPrice * 3n });
      const sold = await musicalToken.getTotalTokensSold();
      expect(sold).to.equal(ethers.parseUnits("3", 18));
    });
  });

  describe("getTicketPrice", function () {
    it("returns current ticket price", async function () {
      const price = await musicalToken.getTicketPrice();
      expect(price).to.equal(ethers.parseUnits("0.01", "ether"));
    });
  });

    describe("buyTicket", function () {
    it("allows user to buy ticket with correct ETH", async function () {
      const price = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(1, { value: price });
      const balance = await musicalToken.balanceOf(user.address);
      expect(balance).to.equal(ethers.parseUnits("1", 18));
    });

    it("reverts if not enough ETH sent", async function () {
      const price = await musicalToken.getTicketPrice();
      await expect(
        musicalToken.connect(user).buyTicket(1, { value: price / 2n })
      ).to.be.revertedWith("Incorrect ETH sent");
    });

    it("reverts if venue tries to buy", async function () {
      const price = await musicalToken.getTicketPrice();
      await expect(
        musicalToken.connect(venue).buyTicket(1, { value: price })
      ).to.be.revertedWith("Venue or Doorman cannot buy tickets");
    });

    it("reverts if doorman tries to buy", async function () {
      const price = await musicalToken.getTicketPrice();
      await expect(
        musicalToken.connect(doorman).buyTicket(1, { value: price })
      ).to.be.revertedWith("Venue or Doorman cannot buy tickets");
    });
  });

   describe("getRefund", function () {
    it("refunds ETH if user has ticket and contract has funds", async function () {
      const price = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(1, { value: price });
      await expect(() =>
        musicalToken.connect(user).getRefund(1)
      ).to.changeEtherBalance(user, price);
    });

    it("reverts if user did not buy ticket", async function () {
      await expect(
        musicalToken.connect(user).getRefund(1)
      ).to.be.revertedWith("Not enough tokens to refund");
    });

    it("reverts if refund amount exceeds user's purchase count", async function () {
      const price = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(1, { value: price });
      await expect(
        musicalToken.connect(user).getRefund(2)
      ).to.be.reverted;
    });

    it("reverts if contract has no ETH", async function () {
      const price = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(1, { value: price });
      await musicalToken.connect(venue).withdrawFunds(price);
      await expect(
        musicalToken.connect(user).getRefund(1)
      ).to.be.revertedWith("Not enough ETH for refund");
    });
  });

  describe("returnTicket", function () {
    it("allows user to return ticket without refund", async function () {
      const price = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(2, { value: price * 2n });
      await musicalToken.connect(user).returnTicket(2);
      const userBalance = await musicalToken.balanceOf(user.address);
      expect(userBalance).to.equal(0n);
    });

    it("reverts if not enough tickets", async function () {
      await expect(
        musicalToken.connect(user).returnTicket(1)
      ).to.be.revertedWith("Not enough tickets to return");
    });

    it("reverts if venue tries to return", async function () {
      await expect(
        musicalToken.connect(venue).returnTicket(1)
      ).to.be.revertedWith("Venue or Doorman cannot return tickets");
    });

    it("reverts if doorman tries to return", async function () {
      await expect(
        musicalToken.connect(doorman).returnTicket(1)
      ).to.be.revertedWith("Venue or Doorman cannot return tickets");
    });
  });

  describe("withdrawFunds", function () {
    it("allows venue to withdraw", async function () {
      const price = await musicalToken.getTicketPrice();
      await musicalToken.connect(user).buyTicket(1, { value: price });
      await expect(() =>
        musicalToken.connect(venue).withdrawFunds(price)
      ).to.changeEtherBalance(venue, price);
    });

    it("reverts if non-venue tries to withdraw", async function () {
      await expect(
        musicalToken.connect(user).withdrawFunds(1)
      ).to.be.revertedWith("Only venue can withdraw funds");
    });

    it("reverts if not enough ETH", async function () {
      await expect(
        musicalToken.connect(venue).withdrawFunds(1)
      ).to.be.revertedWith("Not enough ETH in contract");
    });
  });

  describe("depositFunds", function () {
    it("allows venue to deposit", async function () {
      await expect(() =>
        musicalToken.connect(venue).depositFunds({ value: ethers.parseEther("1") })
      ).to.changeEtherBalance(musicalToken, ethers.parseEther("1"));
    });

    it("reverts if non-venue tries to deposit", async function () {
      await expect(
        musicalToken.connect(user).depositFunds({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Only venue can deposit funds");
    });
  });

  describe("updateTicketPrice", function () {
    it("allows venue to update price", async function () {
      const oldPrice = await musicalToken.getTicketPrice();
      const newPrice = ethers.parseUnits("0.02", "ether");
      await musicalToken.connect(venue).updateTicketPrice(newPrice);
       expect(await musicalToken.getTicketPrice()).to.not.equal(oldPrice);
      expect(await musicalToken.getTicketPrice()).to.equal(newPrice);
    });

    it("reverts if non-venue tries to update", async function () {
      const newPrice = ethers.parseUnits("0.02", "ether");
      await expect(
        musicalToken.connect(user).updateTicketPrice(newPrice)
      ).to.be.revertedWith("Only venue can update the ticket price");
    });

    it("reverts if new price is zero", async function () {
      await expect(
        musicalToken.connect(venue).updateTicketPrice(0)
      ).to.be.revertedWith("Ticket price must be greater than zero");
    });
  });

});