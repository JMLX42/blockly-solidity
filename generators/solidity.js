/**
 * @fileoverview Helper functions for generating Solidity for blocks.
 * @author jeanmarc.leroux@google.com (Jean-Marc Le Roux)
 */
'use strict';

goog.provide('Blockly.Solidity');

goog.require('Blockly.Generator');


/**
 * Solidity code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Solidity = new Blockly.Generator('Solidity');

Blockly.Solidity.STATE_VAR_NAME_PREFIX_FUNC = function(block) { return "__state_"; }
Blockly.Solidity.PARAM_VAR_NAME_PREFIX_FUNC = function(block) {
  var methodBlock = block;
  while (methodBlock && methodBlock.type != "contract_method" && methodBlock.type != "contract_ctor") {
    methodBlock = methodBlock.getParent();
  }
  return "__param_function(" + (!!methodBlock ? methodBlock.id : block.id) + ")_"
};
Blockly.Solidity.VAR_VAR_NAME_PREFIX_FUNC = function(block) { return "__var_" };

Blockly.Solidity.UNDEFINED_STATE_NAME = "__UNDEFINED__";
Blockly.Solidity.UNDEFINED_PARAM_NAME = "__UNDEFINED__";
Blockly.Solidity.UNDEFINED_VAR_NAME = "__UNDEFINED__";

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Solidity.addReservedWords(
    'Blockly,' +  // In case JS is evaled in the current window.
    'FIXME'
);

/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/Solidity/Reference/Operators/Operator_Precedence
 */
Blockly.Solidity.ORDER_ATOMIC = 0;           // 0 "" ...
Blockly.Solidity.ORDER_NEW = 1.1;            // new
Blockly.Solidity.ORDER_MEMBER = 1.2;         // . []
Blockly.Solidity.ORDER_FUNCTION_CALL = 2;    // ()
Blockly.Solidity.ORDER_INCREMENT = 3;        // ++
Blockly.Solidity.ORDER_DECREMENT = 3;        // --
Blockly.Solidity.ORDER_BITWISE_NOT = 4.1;    // ~
Blockly.Solidity.ORDER_UNARY_PLUS = 4.2;     // +
Blockly.Solidity.ORDER_UNARY_NEGATION = 4.3; // -
Blockly.Solidity.ORDER_LOGICAL_NOT = 4.4;    // !
Blockly.Solidity.ORDER_TYPEOF = 4.5;         // typeof
Blockly.Solidity.ORDER_VOID = 4.6;           // void
Blockly.Solidity.ORDER_DELETE = 4.7;         // delete
Blockly.Solidity.ORDER_DIVISION = 5.1;       // /
Blockly.Solidity.ORDER_MULTIPLICATION = 5.2; // *
Blockly.Solidity.ORDER_MODULUS = 5.3;        // %
Blockly.Solidity.ORDER_SUBTRACTION = 6.1;    // -
Blockly.Solidity.ORDER_ADDITION = 6.2;       // +
Blockly.Solidity.ORDER_BITWISE_SHIFT = 7;    // << >> >>>
Blockly.Solidity.ORDER_RELATIONAL = 8;       // < <= > >=
Blockly.Solidity.ORDER_IN = 8;               // in
Blockly.Solidity.ORDER_INSTANCEOF = 8;       // instanceof
Blockly.Solidity.ORDER_EQUALITY = 9;         // == != === !==
Blockly.Solidity.ORDER_BITWISE_AND = 10;     // &
Blockly.Solidity.ORDER_BITWISE_XOR = 11;     // ^
Blockly.Solidity.ORDER_BITWISE_OR = 12;      // |
Blockly.Solidity.ORDER_LOGICAL_AND = 13;     // &&
Blockly.Solidity.ORDER_LOGICAL_OR = 14;      // ||
Blockly.Solidity.ORDER_CONDITIONAL = 15;     // ?:
Blockly.Solidity.ORDER_ASSIGNMENT = 16;      // = += -= *= /= %= <<= >>= ...
Blockly.Solidity.ORDER_COMMA = 17;           // ,
Blockly.Solidity.ORDER_NONE = 99;            // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.Solidity.ORDER_OVERRIDES = [
  // (foo()).bar -> foo().bar
  // (foo())[0] -> foo()[0]
  [Blockly.Solidity.ORDER_FUNCTION_CALL, Blockly.Solidity.ORDER_MEMBER],
  // (foo())() -> foo()()
  [Blockly.Solidity.ORDER_FUNCTION_CALL, Blockly.Solidity.ORDER_FUNCTION_CALL],
  // (foo.bar).baz -> foo.bar.baz
  // (foo.bar)[0] -> foo.bar[0]
  // (foo[0]).bar -> foo[0].bar
  // (foo[0])[1] -> foo[0][1]
  [Blockly.Solidity.ORDER_MEMBER, Blockly.Solidity.ORDER_MEMBER],
  // (foo.bar)() -> foo.bar()
  // (foo[0])() -> foo[0]()
  [Blockly.Solidity.ORDER_MEMBER, Blockly.Solidity.ORDER_FUNCTION_CALL],

  // !(!foo) -> !!foo
  [Blockly.Solidity.ORDER_LOGICAL_NOT, Blockly.Solidity.ORDER_LOGICAL_NOT],
  // a * (b * c) -> a * b * c
  [Blockly.Solidity.ORDER_MULTIPLICATION, Blockly.Solidity.ORDER_MULTIPLICATION],
  // a + (b + c) -> a + b + c
  [Blockly.Solidity.ORDER_ADDITION, Blockly.Solidity.ORDER_ADDITION],
  // a && (b && c) -> a && b && c
  [Blockly.Solidity.ORDER_LOGICAL_AND, Blockly.Solidity.ORDER_LOGICAL_AND],
  // a || (b || c) -> a || b || c
  [Blockly.Solidity.ORDER_LOGICAL_OR, Blockly.Solidity.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Solidity.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Solidity.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.Solidity.functionNames_ = Object.create(null);

  if (!Blockly.Solidity.variableDB_) {
    Blockly.Solidity.variableDB_ =
        new Blockly.Names(Blockly.Solidity.RESERVED_WORDS_);
  } else {
    Blockly.Solidity.variableDB_.reset();
  }


  // var defvars = [];
  // var variables = workspace.getAllVariables();
  // if (variables.length) {
  //   for (var i = 0; i < variables.length; i++) {
  //     defvars[i] = Blockly.Solidity.variableDB_.getName(variables[i].name,
  //         Blockly.Variables.NAME_TYPE);
  //   }
  //   Blockly.Solidity.definitions_['variables'] =
  //       'int ' + defvars.join(', ') + ';';
  // }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Solidity.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Solidity.definitions_) {
    definitions.push(Blockly.Solidity.definitions_[name]);
  }
  // Clean up temporary data.
  delete Blockly.Solidity.definitions_;
  delete Blockly.Solidity.functionNames_;
  Blockly.Solidity.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Solidity.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Solidity string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Solidity string.
 * @private
 */
Blockly.Solidity.quote_ = function(string) {
  // Can't use goog.string.quote since Google's style guide recommends
  // JS string literals use single quotes.
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Solidity from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Solidity code created for this block.
 * @return {string} Solidity code with comments and subsequent blocks added.
 * @private
 */
Blockly.Solidity.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    comment = Blockly.utils.wrap(comment, Blockly.Solidity.COMMENT_WRAP - 3);
    if (comment) {
      if (block.getProcedureDef) {
        // Use a comment block for function comments.
        commentCode += '/**\n' +
                       Blockly.Solidity.prefixLines(comment + '\n', ' * ') +
                       ' */\n';
      } else {
        commentCode += Blockly.Solidity.prefixLines(comment + '\n', '// ');
      }
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Solidity.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Solidity.prefixLines(comment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Solidity.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.Solidity.getAdjusted = function(block, atId, opt_delta, opt_negate,
    opt_order) {
  var delta = opt_delta || 0;
  var order = opt_order || Blockly.Solidity.ORDER_NONE;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  if (delta > 0) {
    var at = Blockly.Solidity.valueToCode(block, atId,
        Blockly.Solidity.ORDER_ADDITION) || defaultAtIndex;
  } else if (delta < 0) {
    var at = Blockly.Solidity.valueToCode(block, atId,
        Blockly.Solidity.ORDER_SUBTRACTION) || defaultAtIndex;
  } else if (opt_negate) {
    var at = Blockly.Solidity.valueToCode(block, atId,
        Blockly.Solidity.ORDER_UNARY_NEGATION) || defaultAtIndex;
  } else {
    var at = Blockly.Solidity.valueToCode(block, atId, order) ||
        defaultAtIndex;
  }

  if (Blockly.isNumber(at)) {
    // If the index is a naked number, adjust it right now.
    at = parseFloat(at) + delta;
    if (opt_negate) {
      at = -at;
    }
  } else {
    // If the index is dynamic, adjust it in code.
    if (delta > 0) {
      at = at + ' + ' + delta;
      var innerOrder = Blockly.Solidity.ORDER_ADDITION;
    } else if (delta < 0) {
      at = at + ' - ' + -delta;
      var innerOrder = Blockly.Solidity.ORDER_SUBTRACTION;
    }
    if (opt_negate) {
      if (delta) {
        at = '-(' + at + ')';
      } else {
        at = '-' + at;
      }
      var innerOrder = Blockly.Solidity.ORDER_UNARY_NEGATION;
    }
    innerOrder = Math.floor(innerOrder);
    order = Math.floor(order);
    if (innerOrder && order >= innerOrder) {
      at = '(' + at + ')';
    }
  }
  return at;
};

Blockly.Solidity.updateWorkspaceNameFields = function(workspace, nameFieldName, prefixFunc, undefinedName) {
  var blocks = workspace.getAllBlocks();
  for (var i = 0; i < blocks.length; ++i) {
    var nameField = blocks[i].getField(nameFieldName);
    if (!!nameField) {
      var prefix = prefixFunc(blocks[i]);

      var vars = workspace.getAllVariables();
      var options = vars.map(function(v) {
          return v.name.startsWith(prefix)
            ? [v.name.replace(prefix, ''), v.id_]
            : null;
        })
        .filter(function(o) { return o !== null });

      var selectedOption = blocks[i].getFieldValue(nameFieldName);

      if (options.length != 0) {
        var wasUndefined = nameField.menuGenerator_[0][1]
          == undefinedName;

        nameField.menuGenerator_ = options;
        if (wasUndefined) {
          nameField.setValue(options[0][1]);
        } else {
          nameField.setValue(selectedOption);
          // The text input does not redraw/update itself after we call "setValue",
          // so we set the text manually.
          nameField.setText(
            options.filter(function(o) {return o[1] == selectedOption})[0][0]
          );
        }
      }
    }
  }
}

Blockly.Solidity.updateWorkspaceTypes = function(workspace, nameFieldName, valueFieldName) {
  var blocks = workspace.getAllBlocks();
  var vars = workspace.getAllVariables();

  for (var i = 0; i < blocks.length; ++i) {
    var stateNameField = blocks[i].getField(nameFieldName);

    if (!stateNameField) {
      continue;
    }

    var variableId = blocks[i].getFieldValue(nameFieldName);
    var variable = workspace.getVariableById(variableId);

    if (!variable) {
      return;
    }

    if (blocks[i].inputList[0] && blocks[i].inputList[0].name == valueFieldName) {
      switch (variable.type) {
        case 'TYPE_BOOL':
          blocks[i].inputList[0].setCheck("Boolean");
          break;
        case 'TYPE_INT':
          blocks[i].inputList[0].setCheck("Number");
          break;
        case 'TYPE_UINT':
          blocks[i].inputList[0].setCheck("Number");
          break;
        default:
      }
    }
    // FIXME: update the output type
  }
}

Blockly.Solidity.updateWorkspaceStateNameFields = function(workspace) {
  Blockly.Solidity.updateWorkspaceNameFields(
    workspace,
    'STATE_NAME',
    Blockly.Solidity.STATE_VAR_NAME_PREFIX_FUNC,
    Blockly.Solidity.UNDEFINED_STATE_NAME
  );
}

Blockly.Solidity.updateWorkspaceStateTypes = function(workspace) {
  Blockly.Solidity.updateWorkspaceTypes(
    workspace,
    "STATE_NAME",
    "STATE_VALUE"
  );
}

Blockly.Solidity.updateWorkspaceParameterNameFields = function(workspace) {
  Blockly.Solidity.updateWorkspaceNameFields(
    workspace,
    'PARAM_NAME',
    Blockly.Solidity.PARAM_VAR_NAME_PREFIX_FUNC,
    Blockly.Solidity.UNDEFINED_PARAM_NAME
  );
}

Blockly.Solidity.updateWorkspaceParameterTypes = function(workspace) {
  Blockly.Solidity.updateWorkspaceTypes(
    workspace,
    "PARAM_NAME",
    "PARAM_VALUE"
  );
}
