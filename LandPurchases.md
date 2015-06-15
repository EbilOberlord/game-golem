# Introduction #

The Castle Age Golem script's Land Purchasing algorithm is the absolute best method for purchasing land.  It is the fastest way to max out your land purchases, guaranteed.


# Details #

The logic behind the land purchasing is as follows.

1) Our goal is to get to the point where we cannot purchase any more land as quickly as possible.  This will maximize our land income.

2) Since the total quantity of each land is the same, our goal does not include determining the best "mix" of land to own.

3) Since we do no need to determine the best "mix", all we need to determine is the next best land to purchase and how many of that land to purchase.

4) Since we will eventually end up buying every land, the best way to choose which land to buy next is to determine the land for which the total time to purchase it followed by any other land, is less than purchasing those two lands in the opposite order.

5) The best quantity to purchase is the least quantity where the time to save for the purchase is greater than the time it takes for the extra income (from the purchase) to pay for the ADDED cost of purchase.

EXAMPLE: It takes 22.22 hours for the extra income generated from purchasing a Dwarven Mine to pay for the increase in the cost of the next Dwarven Mine.

Assuming that the next best land to purchase is a Dwarven Mine.  If it would take more than 22.22 hours to purchase 5 Dwarven Mines, but less than 22.22 hours to purchase 1 Dwarven Mine, you should purchase 5.  Because it will take less time to purchase 5-and-5 then it would take to save up for all 10 at once.


This is a fairly brief overview.  I'll probably go into more detail as time warrants.