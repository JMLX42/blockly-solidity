/**
 * @fileoverview Helper functions for generating Solidity for blocks.
 * @author jeanmarc.leroux@google.com (Jean-Marc Le Roux)
 */
'use strict';

goog.provide('Blockly.Solidity.variables');

goog.require('Blockly.Solidity');


Blockly.Solidity['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.Solidity.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Solidity.ORDER_ATOMIC];
};

Blockly.Solidity['variables_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Solidity.valueToCode(block, 'VALUE',
      Blockly.Solidity.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Solidity.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};
