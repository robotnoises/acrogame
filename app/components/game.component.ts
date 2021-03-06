import {Component, Input, OnInit} from 'angular2/core';
import {FirebaseService}          from './../services/services.firebase';
import {Convert}                  from './../services/Convert.services';
import {TaskModel, TASK_TYPE}     from './../models/models.task';

@Component({
  selector: 'game',
  templateUrl: 'app/templates/templates.game.html',
  providers: [FirebaseService, Convert],
  inputs: ['id']
})

export class Game implements OnInit {
  
  @Input() id: string;
  
  currentGame: any;
  currentRound: any;
  validator: any;
  answers: any[];
  roundType: number;
  answerSubmitted: boolean;
  answerValid: boolean;
  
  $taskRef: any;
  $roundRef: any;
  $answersRef: any;
  
  countdownPercent: string;
  
  constructor(private firebaseService: FirebaseService) {
    this.currentRound = {};
    this.roundType = 0;
    this.answerSubmitted = false;
    this.answerValid = false;
  }
  
  ngOnInit() {
    
    var roundPath = `/games/${this.id}/round`;
    var taskPath = '/queue/tasks';
    var answerPath = `/answers/${this.id}`;
    
    this.$roundRef = this.firebaseService.getRef(roundPath);
    this.$taskRef = this.firebaseService.getRef(taskPath);
    this.$answersRef = this.firebaseService.getRef(answerPath)
    
    this.$roundRef.on('value', ($snap) => this.updateOnChange($snap));
  }
  
  private reset() {
    this.answerSubmitted = false;
    this.answerValid = false;
  }
  
  private validateAnswer(answer: string): boolean {
    this.answerSubmitted = true;    
    try {  
      this.answerValid = (this.validator) ? this.validator.test(answer) : false;
      return this.answerValid;
    } catch (ex) {
      console.error(ex);
      return false;
    }
  }
  
  private newGame() {
    // Todo: in the future we should watch rooms on the server 
    // rather than relying on the client to add the Task
    this.$taskRef.push(new TaskModel(TASK_TYPE.NEW_GAME, {roomId: this.id}))
  }
  
  private updateOnChange($snap) {
    
    /**
     * Watch for changes here!
     */
    
    var value = $snap.val();

    if (!value) return;

    // If this is not a playing round, reset the Round
    if (value.type && value.type !== 1) {
      this.reset();
    }

    // If this is a voting round, let's get the answers
    if (value.type && value.type === 2) {
      this.answers = Convert.objectToArray(value.answers);
    }

    var percent = Math.floor((value.countdown / value.countdownStart) * 100);

    this.currentRound = value;
    this.currentRound.countdown = (value.countdown) ? value.countdown : 0;
    this.currentRound.category = (value.category) ? value.category : null;
    this.currentRound.letters = (value.letters) ? value.letters : null;
    this.countdownPercent = `${percent}%`;
    this.roundType = value.type;
    
    try {
      this.validator = new RegExp(this.currentRound.letters.validator, 'gi');
    } catch (ex) {
      // Swallow exception
      this.validator = null;
    }
  }
  
  onKeyUp($event: any, answer: any) {
    // If they pressed Enter....
    if ($event.keyCode === 13 && answer.value) {  
      // And the answer is valid....
      if (this.validateAnswer(answer.value)) {
        // todo: abc123 represents a user
        this.$roundRef.child('answers/' + 'abc123').set({
          'userId': 'abc123',
          'name': 'me',
          'answer': answer.value
        });
      }
    }
  }
  
  join() {
    // todo, get player info and pass it along
    this.newGame();
  }
  
  vote(answer?: any) {
    try {
      // todo: a real userId
      var userId = 'abc123';
      var $voteRef = this.$roundRef.child(`votes/${userId}`);
      $voteRef.set(userId);
    } catch (ex) {
      console.error(ex);
    }
  }
}