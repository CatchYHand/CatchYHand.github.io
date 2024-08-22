---
layout: page
title: PLC Conveyor System
description: 
img: assets/img/p4.png
importance: 2
category: work
giscus_comments: false
---


In this project, we created a program for the PLC and HMI to control the trainer conveyor belt in the CIM Lab.  The program should have the following features:

    -A visually appealing layout
    -A start button for each of 3 possible operations that the equipment can perform.
    -All the start buttons should be disabled anytime an operation is being performed.
    -A label showing the current operation being performed.
    -An indicator light showing that a process in being performed.
    -An indicator light showing that the current process is complete.
    -An indicator light showing that an error has occurred and a text object that gives information about the error.
    -A visual representation showing the current operation’s completion percentage (0% - 100%)
    -A separate screen containing indicators for each of the inputs and outputs that show the current status of each.

The 3 possible operations are as follows:

Operation1 <br/>

    -Place a block on the conveyor belt blocking the left optical sensor and wait for the start button to be pressed to begin the conveyor moving to the right.
    -When the block reaches the right optical sensor, continue moving the conveyor until the block passes the right optical sensor. 
    -When the block is at the extreme right side of the conveyor, stop the conveyor, pause for 1 second, then extend the right pneumatic cylinder.
    -When the right pneumatic cylinder is fully extended, hold it in that position for 3 seconds.
    -When the right pneumatic cylinder has been extended for 3 seconds, return it to the home position and pause for 1 second after it is home.
    -When the right pneumatic cylinder has returned home and the 1 second timer has elapsed, move the block back to the left side of the conveyor.
    -When the block reaches the left optical sensor, continue moving the conveyor until the block passes the left optical sensor.
    -When the block is at the extreme left side of the conveyor, stop the conveyor and pause for 1 second.
    -When the 1 second timer has elapsed, move the block back to the right side of the conveyor.
    -Complete this cycle 3 times.

Operation 2 <br/>

    -Place a block on the conveyor belt blocking the left optical sensor and wait for the start button to be pressed to begin the conveyor moving to the right.
    -When the block reaches the right optical sensor, stop the conveyor, pause for 1 second, then extend the right pneumatic cylinder.
    -When the right pneumatic cylinder is fully extended, hold it in that position for 1 second.
    -When the right pneumatic cylinder has been extended for 1 second, return it to the home position.
    -When the right pneumatic cylinder has returned home, move the block to the right for 1 second then stop the conveyor again.
    -Perform this cycle 3 times.

Operation 3 <br/>

    -Place a block on the conveyor belt blocking the left optical sensor and wait for the start button to be pressed to begin the conveyor moving to the right.
    -When the block reaches the right optical sensor, use the right optical sensor to measure the length of the block.
    -When the block has passed the right optical sensor, stop the conveyor and visually display the calculated length of the block.


Error conditions <br/>

    -If at any time the block interrupts the middle sensor on the conveyor:
        o Extend the middle pneumatic cylinder to knock the block off the conveyor, then retract it.
        o Stop the conveyor.
        o Provide an alert about this error. (The part does not meet specifications.)
    -If at any time the conveyor runs for more than 20 seconds in either direction without the block reaching any of the sensors:
        o Stop the conveyor.
        o Provide an alert about this error. (The part is stuck or there is a sensor error.)
    -If a start button for one of the operations is ever pressed and a block is not at the left sensor:
        o Provide an alert about this error. (No part is present at the left optical sensor)

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        <iframe id="myEmbedTwo" src="https://CatchYHand.github.io/assets/pdf/PLCConveyorSystem.pdf" width=900 height=1000/>
    </div>
</div>
