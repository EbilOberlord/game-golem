# **Monster Worker** #
List of items to work on for Monster Worker.

## Action Button Code ##
Need to recode how worker finds buttons to take into account new system released by CA Devs.
### Possible Fixes ###
  1. Use current system of hard coding button images and modifying code to use available options (1/5/10/.. Stamina)
    * Pro - Option is possibly easier method to use.
    * Con - Worker must rely on hard coding such that CA Dev changes affect behaviour of Golem.
  1. Re-write system to use a dynamic list maintained in runtime, built using a trial / results method. (Worker clicks button and captures results).
    * Pro - Worker depends less on hard coding and can adapt to CA Dev changes on its own.
    * Con - Difficult to program. Golem will spend resources haphazardly to build list.
### Implementing Action ###
HaploAW
  * For ease of update, going with option 1 but making the option more dynamic.
  * No longer rely on hard coded pictures. Now worker relies on hard coded list of available attacks.
  * Worker can spend a variable amount of stamina on a single attack based on user input.


# **Upgrade Worker** #

## Logic for spending points ##
Need to re-write how worker decides which stats to increase and by how much. Allow more flexibility. (2 x Level, 1/2 Stamina)
### Possible Fixes ###
  1. Allow users to enter typed in formula when using advanced mode.
    * Pro - Allows great flexibility.
    * Con - Relies on user input such that undesireable effects may be seen. No QA control on input.
  1. Provide a systematic formula entry. (Upgrade {drop-box1} using {drop-box2} {drop-box3} {drop-box2}, boxes controlling input)
    * Pro - Ensures a quality input to worker.
    * Con - Logic would create a less flexible method than user entered formula.